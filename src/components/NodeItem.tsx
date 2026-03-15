"use client";

import styles from "./NodeItem.module.css";

export const NODE_W = 100;
export const NODE_H = 48;

const NODE_COLORS: Record<NodeType, string> = {
  router: "#89b4fa",
  switch: "#a6e3a1",
  pc: "#f9e2af",
  server: "#cba6f7",
  "dns-server": "#fab387",
};

function getNodeIp(node: NetworkNode): string | null {
  if (node.type === "router") {
    const iface = node.interfaces.find((i) => i.ipAddress && !i.shutdown);
    return iface?.ipAddress ?? null;
  }
  return node.ipAddress;
}

interface Props {
  node: NetworkNode;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent<SVGRectElement>) => void;
  onMouseUp: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent<SVGGElement>) => void;
}

export default function NodeItem({
  node,
  isSelected,
  isHovered,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
}: Props) {
  const { x, y } = node.position;
  const color = NODE_COLORS[node.type];
  const ip = getNodeIp(node);

  return (
    <g
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      style={{ cursor: "pointer" }}
    >
      {/* ホバー時のグロー */}
      {isHovered && !isSelected && (
        <rect
          x={x - 3}
          y={y - 3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={10}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.3}
          pointerEvents="none"
        />
      )}
      {/* ノード本体 */}
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill={isSelected ? color : "#313244"}
        stroke={color}
        strokeWidth={isSelected ? 2 : 1.5}
        onMouseDown={onMouseDown}
        style={{ cursor: "grab" }}
      />
      {/* ノード名 */}
      <text
        x={x + NODE_W / 2}
        y={y + (ip ? 18 : 28)}
        textAnchor="middle"
        fill={isSelected ? "#1e1e2e" : color}
        fontSize={12}
        fontWeight={600}
        fontFamily="monospace"
        pointerEvents="none"
      >
        {node.name}
      </text>
      {/* IPアドレス */}
      {ip && (
        <text
          x={x + NODE_W / 2}
          y={y + 34}
          textAnchor="middle"
          fill={isSelected ? "#1e1e2e" : "#6c7086"}
          fontSize={9}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {ip}
        </text>
      )}
    </g>
  );
}

export { styles };
