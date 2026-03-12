import { generateNodeId, generateLinkId } from "@/utils/id-generator";
import { createInitialPorts } from "@/utils/node-factory";

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

/** ノードを新規作成（IDと名前は自動生成）。全ポートを事前作成する。 */
function createNode(
  nodes: Map<NodeId, NetworkNode>,
  type: NodeType,
  position: { x: number; y: number }
): NetworkNode {
  const id = generateNodeId();
  const name = nextNodeName(nodes, type);
  const ports = createInitialPorts(type);
  const base = { id, type, name, position, ports } as const;

  switch (type) {
    case "router": {
      // 8つのポートに対応する8つのRouterInterfaceを事前作成（すべてshutdown）
      const interfaces: RouterInterface[] = ports.map((p) => ({
        portName: p.name,
        ipAddress: null,
        subnetMask: null,
        shutdown: true,
      }));
      return {
        ...base,
        type: "router",
        interfaces,
        staticRoutes: [],
        configText: "",
      };
    }
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

/** ノードを削除（紐づくリンクも同時削除、他ノードのポートのlinkedLinkIdもクリア） */
export function deleteNode(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  nodeId: NodeId
): { nodes: Map<NodeId, NetworkNode>; links: Map<LinkId, Link> } {
  // 削除対象ノードに紐づくリンクIDを収集
  const removedLinkIds = new Set<LinkId>();
  for (const [linkId, link] of links) {
    if (link.nodeA === nodeId || link.nodeB === nodeId) {
      removedLinkIds.add(linkId);
    }
  }

  // リンク削除
  const newLinks = new Map(links);
  for (const linkId of removedLinkIds) {
    newLinks.delete(linkId);
  }

  // 他ノードのポートのlinkedLinkIdをクリア
  const newNodes = new Map(nodes);
  newNodes.delete(nodeId);

  for (const [nid, node] of newNodes) {
    const updatedPorts = node.ports.map((p) =>
      p.linkedLinkId !== null && removedLinkIds.has(p.linkedLinkId)
        ? { ...p, linkedLinkId: null }
        : p
    );
    // ポートが変わっていたらノードを更新
    if (updatedPorts.some((p, i) => p !== node.ports[i])) {
      newNodes.set(nid, { ...node, ports: updatedPorts } as NetworkNode);
    }
  }

  return { nodes: newNodes, links: newLinks };
}

/**
 * リンクを追加
 * 引数に portAId / portBId を受け取り、ポートの linkedLinkId を更新する。
 * 失敗時はnullを返す。
 */
export function addLink(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  nodeAId: NodeId,
  portAId: PortId,
  nodeBId: NodeId,
  portBId: PortId
): { nodes: Map<NodeId, NetworkNode>; links: Map<LinkId, Link>; newLink: Link } | null {
  // 存在チェック
  const nodeA = nodes.get(nodeAId);
  const nodeB = nodes.get(nodeBId);
  if (!nodeA || !nodeB) return null;
  // 自己ループ禁止
  if (nodeAId === nodeBId) return null;

  // ポート存在チェック
  const portA = nodeA.ports.find((p) => p.id === portAId);
  const portB = nodeB.ports.find((p) => p.id === portBId);
  if (!portA || !portB) return null;

  // ポート使用中チェック
  if (portA.linkedLinkId !== null || portB.linkedLinkId !== null) return null;

  // リンク作成
  const newLink: Link = {
    id: generateLinkId(),
    nodeA: nodeAId,
    portA: portAId,
    nodeB: nodeBId,
    portB: portBId,
  };

  const newLinks = new Map(links);
  newLinks.set(newLink.id, newLink);

  // ポートのlinkedLinkIdを更新
  const newNodes = new Map(nodes);

  const updatedPortsA = nodeA.ports.map((p) =>
    p.id === portAId ? { ...p, linkedLinkId: newLink.id } : p
  );
  newNodes.set(nodeAId, { ...nodeA, ports: updatedPortsA } as NetworkNode);

  const updatedNodeB = newNodes.get(nodeBId)!;
  const updatedPortsB = updatedNodeB.ports.map((p) =>
    p.id === portBId ? { ...p, linkedLinkId: newLink.id } : p
  );
  newNodes.set(nodeBId, { ...updatedNodeB, ports: updatedPortsB } as NetworkNode);

  return { nodes: newNodes, links: newLinks, newLink };
}

/**
 * リンクを削除（両端ノードのポートのlinkedLinkIdもクリア）
 */
export function deleteLink(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  linkId: LinkId
): { nodes: Map<NodeId, NetworkNode>; links: Map<LinkId, Link> } {
  const link = links.get(linkId);
  if (!link) return { nodes, links };

  const newLinks = new Map(links);
  newLinks.delete(linkId);

  const newNodes = new Map(nodes);

  // ポートA のクリア
  const nodeA = newNodes.get(link.nodeA);
  if (nodeA) {
    const updatedPorts = nodeA.ports.map((p) =>
      p.linkedLinkId === linkId ? { ...p, linkedLinkId: null } : p
    );
    newNodes.set(link.nodeA, { ...nodeA, ports: updatedPorts } as NetworkNode);
  }

  // ポートB のクリア
  const nodeB = newNodes.get(link.nodeB);
  if (nodeB) {
    const updatedPorts = nodeB.ports.map((p) =>
      p.linkedLinkId === linkId ? { ...p, linkedLinkId: null } : p
    );
    newNodes.set(link.nodeB, { ...nodeB, ports: updatedPorts } as NetworkNode);
  }

  return { nodes: newNodes, links: newLinks };
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
