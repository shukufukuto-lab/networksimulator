// =============================================================
// ルーティングドメインロジック
// IP経路探索・Ping疎通判定・DNS解決・Webアクセス判定
// =============================================================

// 内部用の経路計算結果型
type RouteResult =
  | { success: true; hops: NodeId[] }
  | { success: false; reason: PingFailReason };

// -------------------------------------------------------------
// 共通ユーティリティ
// -------------------------------------------------------------

/** 同一サブネット判定 */
function inSameSubnet(ip1: string, mask: string, ip2: string): boolean {
  const p1 = ip1.split(".").map(Number);
  const p2 = ip2.split(".").map(Number);
  const m = mask.split(".").map(Number);
  for (let i = 0; i < 4; i++) {
    if ((p1[i] & m[i]) !== (p2[i] & m[i])) return false;
  }
  return true;
}

/** スタティックルートの最長プレフィックスマッチ */
function longestPrefixMatch(
  routes: StaticRoute[],
  destIp: string
): IpAddress | null {
  let best: IpAddress | null = null;
  let bestLen = -1;
  for (const route of routes) {
    if (inSameSubnet(route.destination, route.mask, destIp)) {
      const maskParts = route.mask.split(".").map(Number);
      const bits = maskParts.reduce(
        (acc, b) => acc + b.toString(2).replace(/0/g, "").length,
        0
      );
      if (bits > bestLen) {
        bestLen = bits;
        best = route.nextHop;
      }
    }
  }
  return best;
}

/** ノードが指定IPを持つか判定 */
function nodeMatchesIp(node: NetworkNode, ip: string): boolean {
  switch (node.type) {
    case "router":
      return node.interfaces.some(
        (iface) => iface.ipAddress === ip && !iface.shutdown
      );
    case "switch":
      return node.ipAddress === ip;
    case "pc":
      return node.ipAddress === ip;
    case "server":
      return node.ipAddress === ip;
    case "dns-server":
      return node.ipAddress === ip;
  }
}

/** ノードが何らかのIPを持つか（疎通可能か）判定 */
function hasAnyIp(node: NetworkNode): boolean {
  if (node.type === "router") {
    return node.interfaces.some(
      (iface) => iface.ipAddress !== null && !iface.shutdown
    );
  }
  return node.ipAddress !== null;
}

/**
 * 現在ノードから destIp に向けた次ホップIPを返す
 * - pc/server/dns-server: 同一サブネットなら直接、それ以外はデフォルトGW
 * - router: 直結サブネットまたはスタティックルート
 * - switch: L3ルーティング不可 → null
 */
function getNextHop(node: NetworkNode, destIp: string): string | null {
  switch (node.type) {
    case "pc":
    case "server":
    case "dns-server": {
      if (!node.ipAddress || !node.subnetMask) return null;
      if (inSameSubnet(node.ipAddress, node.subnetMask, destIp)) {
        return destIp; // 直接配送
      }
      return node.defaultGateway; // デフォルトGW
    }
    case "router": {
      // 直結サブネットチェック
      for (const iface of node.interfaces) {
        if (iface.ipAddress && iface.subnetMask && !iface.shutdown) {
          if (inSameSubnet(iface.ipAddress, iface.subnetMask, destIp)) {
            return destIp; // 直結
          }
        }
      }
      // スタティックルート（最長プレフィックスマッチ）
      return longestPrefixMatch(node.staticRoutes, destIp);
    }
    case "switch":
      return null;
  }
}

/**
 * 物理トポロジ上でBFSを行い、targetIp を持つノードへのパスを返す。
 * スイッチはL2透過として通過する。Router/PC/Server/DNSは通過しない（発見した場合のみ返す）。
 */
function bfsToIp(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  fromId: NodeId,
  targetIp: string,
  forbidden: Set<NodeId>
): NodeId[] | null {
  // BFS: [path]
  const queue: NodeId[][] = [[fromId]];
  const visited = new Set<NodeId>([fromId, ...forbidden]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    // 隣接ノードを探索
    for (const link of links.values()) {
      let neighborId: NodeId | null = null;
      if (link.nodeA === current) neighborId = link.nodeB;
      else if (link.nodeB === current) neighborId = link.nodeA;
      if (!neighborId) continue;
      if (visited.has(neighborId)) continue;

      visited.add(neighborId);
      const newPath = [...path, neighborId];
      const neighbor = nodes.get(neighborId);
      if (!neighbor) continue;

      // 目標IPを持つノードを発見
      if (nodeMatchesIp(neighbor, targetIp)) {
        return newPath;
      }

      // スイッチのみ通過（L2透過）
      if (neighbor.type === "switch") {
        queue.push(newPath);
      }
      // Router/PC/Server/DNSは通過しない（targetIpでなければ終端）
    }
  }

  return null;
}

/** IPアドレスっぽい文字列かどうか判定 */
function isIpAddress(str: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str);
}

/** 指定IPを持つノードをトポロジから検索 */
function findNodeByIp(
  nodes: Map<NodeId, NetworkNode>,
  ip: string
): NetworkNode | null {
  for (const node of nodes.values()) {
    if (nodeMatchesIp(node, ip)) return node;
  }
  return null;
}

// -------------------------------------------------------------
// 内部ルーティングエンジン
// -------------------------------------------------------------

const MAX_HOPS = 30;

/**
 * srcId から destIp への経路を計算する。
 * 戻り値は成功時にホップ列（NodeId[]）、失敗時に失敗理由。
 */
function computeRoute(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  srcId: NodeId,
  destIp: string
): RouteResult {
  const srcNode = nodes.get(srcId);
  if (!srcNode) {
    return { success: false, reason: "GENERAL_FAILURE" };
  }
  if (!hasAnyIp(srcNode)) {
    return { success: false, reason: "IP_NOT_CONFIGURED" };
  }

  const physicalPath: NodeId[] = [srcId];
  let routingHop = srcId;
  const visitedRouting = new Set<NodeId>([srcId]);

  for (let i = 0; i < MAX_HOPS; i++) {
    const node = nodes.get(routingHop);
    if (!node) return { success: false, reason: "GENERAL_FAILURE" };

    // 目的地に到達したか
    if (nodeMatchesIp(node, destIp)) {
      return { success: true, hops: physicalPath };
    }

    // 次ホップIPを決定
    const nextHopIp = getNextHop(node, destIp);
    if (!nextHopIp) {
      return { success: false, reason: "DESTINATION_HOST_UNREACHABLE" };
    }

    // 物理的に次ホップノードまでのパスを探索（スイッチ透過）
    const segment = bfsToIp(
      nodes,
      links,
      routingHop,
      nextHopIp,
      new Set(visitedRouting)
    );
    if (!segment) {
      return { success: false, reason: "DESTINATION_HOST_UNREACHABLE" };
    }

    // パスに追加（先頭は既に physicalPath に含まれるためスキップ）
    for (const id of segment.slice(1)) {
      physicalPath.push(id);
    }

    const nextRoutingHop = segment[segment.length - 1];

    // ループ検出
    if (visitedRouting.has(nextRoutingHop)) {
      return { success: false, reason: "TTL_EXPIRED_IN_TRANSIT" };
    }
    visitedRouting.add(nextRoutingHop);
    routingHop = nextRoutingHop;
  }

  return { success: false, reason: "TTL_EXPIRED_IN_TRANSIT" };
}

// -------------------------------------------------------------
// Ping失敗メッセージ変換
// -------------------------------------------------------------

function failMessage(reason: PingFailReason): string {
  switch (reason) {
    case "REQUEST_TIMED_OUT":
      return "要求がタイムアウトしました。";
    case "DESTINATION_HOST_UNREACHABLE":
      return "宛先ホストに到達できません。";
    case "TTL_EXPIRED_IN_TRANSIT":
      return "TTLが転送中に期限切れになりました。";
    case "IP_NOT_CONFIGURED":
      return "IPアドレスが設定されていません。";
    case "GENERAL_FAILURE":
      return "一般的な失敗です。";
  }
}

// -------------------------------------------------------------
// 公開API
// -------------------------------------------------------------

/**
 * Ping疎通判定。destination は IPアドレス or ホスト名（ホスト名は簡易DNS解決）。
 */
export function computePing(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: PingRequest
): PingResult {
  const srcNode = nodes.get(request.source);
  if (!srcNode) {
    return {
      request,
      success: false,
      hops: [],
      failReason: "GENERAL_FAILURE",
      message: "送信元ノードが見つかりません。",
    };
  }

  // destination がホスト名の場合は簡易DNS解決
  let destIp = request.destination;
  if (!isIpAddress(destIp)) {
    // PCのDNS設定を使って解決
    if (srcNode.type !== "pc" && srcNode.type !== "server") {
      return {
        request,
        success: false,
        hops: [],
        failReason: "GENERAL_FAILURE",
        message: "一般的な失敗です。",
      };
    }
    const dnsServerIp = srcNode.dnsServer;
    if (!dnsServerIp) {
      return {
        request,
        success: false,
        hops: [],
        failReason: "DESTINATION_HOST_UNREACHABLE",
        message: "DNSサーバが設定されていません。",
      };
    }
    const dnsNode = findNodeByIp(nodes, dnsServerIp);
    if (!dnsNode || dnsNode.type !== "dns-server") {
      return {
        request,
        success: false,
        hops: [],
        failReason: "DESTINATION_HOST_UNREACHABLE",
        message: "宛先ホストに到達できません。",
      };
    }
    const record = dnsNode.aRecords.find(
      (r) => r.domain === request.destination
    );
    if (!record) {
      return {
        request,
        success: false,
        hops: [],
        failReason: "DESTINATION_HOST_UNREACHABLE",
        message: "宛先ホストに到達できません。",
      };
    }
    destIp = record.ipAddress;
  }

  const result = computeRoute(nodes, links, request.source, destIp);
  if (result.success) {
    return {
      request,
      success: true,
      hops: result.hops,
      failReason: null,
      message: `${destIp} からの応答: 成功`,
    };
  } else {
    return {
      request,
      success: false,
      hops: [],
      failReason: result.reason,
      message: failMessage(result.reason),
    };
  }
}

/**
 * DNS名前解決。
 * sourceId → dnsServerIp への経路を確認し、domainのAレコードを返す。
 */
export function resolveDns(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  sourceId: NodeId,
  dnsServerIp: IpAddress,
  domain: string
): { result: DnsResolutionResult; hops: NodeId[] } {
  // DNSサーバ疎通確認
  const routeResult = computeRoute(nodes, links, sourceId, dnsServerIp);
  if (!routeResult.success) {
    return {
      result: { success: false, reason: "DNS_SERVER_UNREACHABLE" },
      hops: [],
    };
  }

  // DNSサーバノードを検索
  const dnsNode = findNodeByIp(nodes, dnsServerIp);
  if (!dnsNode || dnsNode.type !== "dns-server") {
    return {
      result: { success: false, reason: "DNS_SERVER_UNREACHABLE" },
      hops: routeResult.hops,
    };
  }

  // Aレコード検索
  const record = dnsNode.aRecords.find((r) => r.domain === domain);
  if (!record) {
    return {
      result: { success: false, reason: "DOMAIN_NOT_FOUND" },
      hops: routeResult.hops,
    };
  }

  return {
    result: { success: true, resolvedIp: record.ipAddress },
    hops: routeResult.hops,
  };
}

/**
 * URLからドメイン名を抽出
 * 例: "http://example.com/path" → "example.com"
 */
function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Webアクセス通信判定。
 * DNS名前解決 → HTTPアクセス の2段階を判定する。
 */
export function computeWeb(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: WebRequest
): WebResult {
  const srcNode = nodes.get(request.sourceNodeId);

  if (!srcNode || srcNode.type !== "pc") {
    return {
      request,
      dnsResult: { success: false, reason: "DNS_SERVER_UNREACHABLE" },
      httpStatus: null,
      success: false,
      message: "送信元PCが見つかりません。",
      hops: [],
    };
  }

  // URLからドメイン抽出
  const domain = extractDomain(request.url);
  if (!domain) {
    return {
      request,
      dnsResult: { success: false, reason: "DNS_SERVER_UNREACHABLE" },
      httpStatus: null,
      success: false,
      message: "URLが無効です。",
      hops: [],
    };
  }

  // DNSサーバが設定されているか
  if (!srcNode.dnsServer) {
    return {
      request,
      dnsResult: { success: false, reason: "DNS_SERVER_UNREACHABLE" },
      httpStatus: null,
      success: false,
      message: "DNSサーバが設定されていません。",
      hops: [],
    };
  }

  // DNS名前解決
  const dnsResolution = resolveDns(
    nodes,
    links,
    request.sourceNodeId,
    srcNode.dnsServer,
    domain
  );

  if (!dnsResolution.result.success) {
    const reason = dnsResolution.result.reason;
    const message =
      reason === "DNS_SERVER_UNREACHABLE"
        ? "DNSサーバに到達できません。"
        : `ドメイン '${domain}' が見つかりません。`;
    return {
      request,
      dnsResult: dnsResolution.result,
      httpStatus: null,
      success: false,
      message,
      hops: dnsResolution.hops,
    };
  }

  const resolvedIp = dnsResolution.result.resolvedIp;

  // HTTPルーティング（PC → サーバ）
  const httpRoute = computeRoute(
    nodes,
    links,
    request.sourceNodeId,
    resolvedIp
  );

  // DNS + HTTP の全ホップ（PCは重複するため2段目の先頭をスキップ）
  const allHops =
    httpRoute.success
      ? [...dnsResolution.hops, ...httpRoute.hops.slice(1)]
      : dnsResolution.hops;

  if (!httpRoute.success) {
    return {
      request,
      dnsResult: dnsResolution.result,
      httpStatus: 503,
      success: false,
      message: "サーバに接続できません。",
      hops: allHops,
    };
  }

  // サーバノードの確認
  const serverNode = findNodeByIp(nodes, resolvedIp);
  if (!serverNode || serverNode.type !== "server") {
    return {
      request,
      dnsResult: dnsResolution.result,
      httpStatus: 404,
      success: false,
      message: "ページが見つかりません。",
      hops: allHops,
    };
  }

  // ドメインがサーバにホストされているか
  if (!(serverNode.hostedDomains as string[]).includes(domain)) {
    return {
      request,
      dnsResult: dnsResolution.result,
      httpStatus: 404,
      success: false,
      message: "ページが見つかりません。",
      hops: allHops,
    };
  }

  return {
    request,
    dnsResult: dnsResolution.result,
    httpStatus: 200,
    success: true,
    message: `${request.url} に接続しました。`,
    hops: allHops,
  };
}
