import { generateNodeId, generateLinkId } from "@/utils/id-generator";

// ノード種別ごとの名前プレフィックス
const NODE_PREFIX: Record<NodeType, string> = {
  router: "Router",
  switch: "Switch",
  pc: "PC",
  server: "Server",
  "dns-server": "DNS",
};

/** 既存ノードの最大番号+1で次の名前を生成 */
function nextNodeName(nodes: Map<NodeId, NetworkNode>, type: NodeType): string {
  const prefix = NODE_PREFIX[type];
  let max = 0;
  for (const node of nodes.values()) {
    if (node.type === type) {
      const match = node.name.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
  }
  return `${prefix}${max + 1}`;
}

/** ノードを新規作成（IDと名前は自動生成） */
function createNode(
  nodes: Map<NodeId, NetworkNode>,
  type: NodeType,
  position: { x: number; y: number }
): NetworkNode {
  const id = generateNodeId();
  const name = nextNodeName(nodes, type);
  const base = { id, type, name, position } as const;

  switch (type) {
    case "router":
      return {
        ...base,
        type: "router",
        interfaces: [
          {
            name: "GigabitEthernet0/0",
            ipAddress: null,
            subnetMask: null,
            shutdown: true,
          },
        ],
        staticRoutes: [],
        configText: "",
      };
    case "switch":
      return {
        ...base,
        type: "switch",
        ipAddress: null,
        subnetMask: null,
        vlans: [],
        configText: "",
      };
    case "pc":
      return {
        ...base,
        type: "pc",
        ipAddress: null,
        subnetMask: null,
        defaultGateway: null,
        dnsServer: null,
      };
    case "server":
      return {
        ...base,
        type: "server",
        ipAddress: null,
        subnetMask: null,
        defaultGateway: null,
        dnsServer: null,
        hostedDomains: [],
      };
    case "dns-server":
      return {
        ...base,
        type: "dns-server",
        ipAddress: null,
        subnetMask: null,
        defaultGateway: null,
        aRecords: [],
      };
  }
}

/** ノードを追加 */
export function addNode(
  nodes: Map<NodeId, NetworkNode>,
  type: NodeType,
  position: { x: number; y: number }
): { nodes: Map<NodeId, NetworkNode>; newNode: NetworkNode } {
  const newNode = createNode(nodes, type, position);
  const newNodes = new Map(nodes);
  newNodes.set(newNode.id, newNode);
  return { nodes: newNodes, newNode };
}

/** ノードを削除（紐づくリンクも同時削除） */
export function deleteNode(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  nodeId: NodeId
): { nodes: Map<NodeId, NetworkNode>; links: Map<LinkId, Link> } {
  const newNodes = new Map(nodes);
  newNodes.delete(nodeId);

  const newLinks = new Map(links);
  for (const [linkId, link] of links) {
    if (link.nodeA === nodeId || link.nodeB === nodeId) {
      newLinks.delete(linkId);
    }
  }

  return { nodes: newNodes, links: newLinks };
}

/** 特定ノードに接続されているリンク数を数える */
function countLinksFor(links: Map<LinkId, Link>, nodeId: NodeId): number {
  let count = 0;
  for (const link of links.values()) {
    if (link.nodeA === nodeId || link.nodeB === nodeId) count++;
  }
  return count;
}

/**
 * リンクを追加
 * - 重複リンク禁止
 * - Routerは接続ごとにIFを自動追加（最大8）
 * - 失敗時はnullを返す
 */
export function addLink(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  nodeAId: NodeId,
  nodeBId: NodeId
): { nodes: Map<NodeId, NetworkNode>; links: Map<LinkId, Link>; newLink: Link } | null {
  // 存在チェック
  if (!nodes.has(nodeAId) || !nodes.has(nodeBId)) return null;
  // 自己ループ禁止
  if (nodeAId === nodeBId) return null;

  // 重複リンク禁止
  for (const link of links.values()) {
    if (
      (link.nodeA === nodeAId && link.nodeB === nodeBId) ||
      (link.nodeA === nodeBId && link.nodeB === nodeAId)
    ) {
      return null;
    }
  }

  const nodeA = nodes.get(nodeAId)!;
  const nodeB = nodes.get(nodeBId)!;

  // RouterのIF上限チェック（上限8 = 最大7リンク）
  if (nodeA.type === "router" && nodeA.interfaces.length >= 8) return null;
  if (nodeB.type === "router" && nodeB.interfaces.length >= 8) return null;

  // リンク作成
  const newLink: Link = {
    id: generateLinkId(),
    nodeA: nodeAId,
    nodeB: nodeBId,
  };

  const newLinks = new Map(links);
  newLinks.set(newLink.id, newLink);

  let newNodes = new Map(nodes);

  // RouterAにIF自動追加
  if (nodeA.type === "router" && nodeA.interfaces.length < 8) {
    const newIface: RouterInterface = {
      name: `GigabitEthernet0/${nodeA.interfaces.length}`,
      ipAddress: null,
      subnetMask: null,
      shutdown: true,
    };
    const updatedA: Router = {
      ...nodeA,
      interfaces: [...nodeA.interfaces, newIface],
    };
    newNodes.set(nodeAId, updatedA);
  }

  // RouterBにIF自動追加（newNodesから取り直す）
  const currentB = newNodes.get(nodeBId)!;
  if (currentB.type === "router" && currentB.interfaces.length < 8) {
    const newIface: RouterInterface = {
      name: `GigabitEthernet0/${currentB.interfaces.length}`,
      ipAddress: null,
      subnetMask: null,
      shutdown: true,
    };
    const updatedB: Router = {
      ...currentB,
      interfaces: [...currentB.interfaces, newIface],
    };
    newNodes.set(nodeBId, updatedB);
  }

  return { nodes: newNodes, links: newLinks, newLink };
}

/** リンクを削除 */
export function deleteLink(
  links: Map<LinkId, Link>,
  linkId: LinkId
): Map<LinkId, Link> {
  const newLinks = new Map(links);
  newLinks.delete(linkId);
  return newLinks;
}

/** ノードの座標を更新 */
export function moveNode(
  nodes: Map<NodeId, NetworkNode>,
  nodeId: NodeId,
  position: { x: number; y: number }
): Map<NodeId, NetworkNode> {
  const node = nodes.get(nodeId);
  if (!node) return nodes;
  const updatedNode = { ...node, position };
  const newNodes = new Map(nodes);
  newNodes.set(nodeId, updatedNode as NetworkNode);
  return newNodes;
}

/** ノードの設定を更新 */
export function updateNode(
  nodes: Map<NodeId, NetworkNode>,
  updatedNode: NetworkNode
): Map<NodeId, NetworkNode> {
  if (!nodes.has(updatedNode.id)) return nodes;
  const newNodes = new Map(nodes);
  newNodes.set(updatedNode.id, updatedNode);
  return newNodes;
}

/** ノードに接続されているリンク一覧を返す（外部利用向け） */
export function getNodeLinks(
  links: Map<LinkId, Link>,
  nodeId: NodeId
): Link[] {
  const result: Link[] = [];
  for (const link of links.values()) {
    if (link.nodeA === nodeId || link.nodeB === nodeId) {
      result.push(link);
    }
  }
  return result;
}

// countLinksFor を外部でも使えるようにエクスポート
export { countLinksFor };
