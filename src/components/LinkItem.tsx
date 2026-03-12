"use client";

import { NODE_W, NODE_H } from "@/components/NodeItem";

interface Props {
  link: Link;
  nodes: Map<NodeId, NetworkNode>;
  isActive: boolean;
  onContextMenu: (e: React.MouseEvent<SVGLineElement>) => void;
}

/** ノードの中心座標を返す */
function nodeCenter(node: NetworkNode): { x: number; y: number } {
  return {
    x: node.position.x + NODE_W / 2,
    y: node.position.y + NODE_H / 2,
  };
}

export default function LinkItem({
  link,
  nodes,
  isActive,
  onContextMenu,
}: Props) {
  const nodeA = nodes.get(link.nodeA);
  const nodeB = nodes.get(link.nodeB);
  if (!nodeA || !nodeB) return null;

  const a = nodeCenter(nodeA);
  const b = nodeCenter(nodeB);

  return (
    <>
      {/* 太いヒット領域（右クリック検出用） */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: "context-menu" }}
        onContextMenu={onContextMenu}
      />
      {/* 見た目のライン */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={isActive ? "#89b4fa" : "#585b70"}
        strokeWidth={isActive ? 3 : 2}
        strokeDasharray={isActive ? "none" : undefined}
        pointerEvents="none"
        style={
          isActive
            ? {
                filter: "drop-shadow(0 0 4px #89b4fa)",
              }
            : undefined
        }
      />
    </>
  );
}
