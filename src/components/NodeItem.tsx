"use client";

import styles from "./NodeItem.module.css";

export const NODE_W = 100;
export const NODE_H = 48;

// ノード種別ごとの色
const NODE_COLORS: Record<NodeType, string> = {
  router: "#89b4fa",
  switch: "#a6e3a1",
  pc: "#f9e2af",
  server: "#cba6f7",
  "dns-server": "#fab387",
};

// 接続点の相対座標（ポート表示用）
const CONNECTION_POINT_POSITIONS = [
  { dx: NODE_W / 2, dy: 0 },
  { dx: NODE_W, dy: NODE_H / 2 },
  { dx: NODE_W / 2, dy: NODE_H },
  { dx: 0, dy: NODE_H / 2 },
] as const;

/** ノードのIPアドレスを返す（Router は最初の設定済みIF） */
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
  /** trueのときのみポート接続点を表示・クリック可能にする */
  portsInteractive: boolean;
  onMouseDown: (e: React.MouseEvent<SVGRectElement>) => void;
  onMouseUp: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onConnectStart: (e: React.MouseEvent<SVGCircleElement>, portId: PortId) => void;
  onContextMenu: (e: React.MouseEvent<SVGGElement>) => void;
}

export default function NodeItem({
  node,
  isSelected,
  isHovered,
  portsInteractive,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  onConnectStart,
  onContextMenu,
}: Props) {
  const { x, y } = node.position;
  const color = NODE_COLORS[node.type];
  const ip = getNodeIp(node);

  // 空きポートのみ接続点として表示（最大4箇所の位置にマッピング）
  const freePorts = node.ports.filter((p) => p.linkedLinkId === null);

  return (
    <g
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      style={{ cursor: "pointer" }}
    >
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

      {/* 接続点（portsInteractiveのみ表示・クリック可） */}
      {portsInteractive &&
        freePorts.map((port, i) => {
          const cp =
            CONNECTION_POINT_POSITIONS[i % CONNECTION_POINT_POSITIONS.length];
          return (
            <circle
              key={port.id}
              cx={x + cp.dx}
              cy={y + cp.dy}
              r={6}
              fill="#89b4fa"
              stroke="#1e1e2e"
              strokeWidth={2}
              style={{ cursor: "crosshair" }}
              onMouseDown={(e) => onConnectStart(e, port.id)}
            />
          );
        })}
    </g>
  );
}

// CSS module は NodeItem.module.css として作成（空でもOK）
export { styles };
