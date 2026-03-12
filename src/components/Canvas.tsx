"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import NodeItem, { NODE_W, NODE_H } from "@/components/NodeItem";
import LinkItem from "@/components/LinkItem";
import { getActiveLinks } from "@/domain/simulation";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Canvas.module.css";

interface Props {
  nodes: Map<NodeId, NetworkNode>;
  links: Map<LinkId, Link>;
  drag: DragState;
  simulation: SimulationState;
  selectedNodeId: NodeId | null;
  dispatch: React.Dispatch<Action>;
}

export default function Canvas({
  nodes,
  links,
  drag,
  simulation,
  selectedNodeId,
  dispatch,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<NodeId | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  /** マウス座標をSVG座標に変換 */
  const toSvgPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: clientX, y: clientY };
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    []
  );

  // ドラッグ中のグローバルマウスイベント
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d.kind === "moving-node") {
        const pos = toSvgPoint(e.clientX, e.clientY);
        dispatch({
          type: "MOVE_NODE",
          payload: {
            nodeId: d.nodeId,
            position: {
              x: pos.x - d.offset.x,
              y: pos.y - d.offset.y,
            },
          },
        });
      } else if (d.kind === "creating-link") {
        const pos = toSvgPoint(e.clientX, e.clientY);
        dispatch({
          type: "SET_DRAG",
          payload: { ...d, currentPosition: pos },
        });
      }
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (d.kind === "moving-node" || d.kind === "creating-link") {
        dispatch({ type: "CLEAR_DRAG" });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dispatch, toSvgPoint]);

  // パレットからのドロップ
  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("nodeType") as NodeType;
    if (!nodeType) return;
    const pos = toSvgPoint(e.clientX, e.clientY);
    dispatch({
      type: "ADD_NODE",
      payload: {
        nodeType,
        position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      },
    });
  };

  // SVG背景クリック → 選択解除
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (e.target === svgRef.current) {
      dispatch({ type: "DESELECT_NODE" });
    }
  };

  // ノードのmousedown → ノード移動開始
  const handleNodeMouseDown = (
    e: React.MouseEvent<SVGRectElement>,
    nodeId: NodeId
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const pos = toSvgPoint(e.clientX, e.clientY);
    const node = nodes.get(nodeId);
    if (!node) return;
    dispatch({ type: "SELECT_NODE", payload: { nodeId } });
    dispatch({
      type: "SET_DRAG",
      payload: {
        kind: "moving-node",
        nodeId,
        offset: {
          x: pos.x - node.position.x,
          y: pos.y - node.position.y,
        },
        currentPosition: pos,
      },
    });
  };

  // 接続点mousedown → リンク作成開始
  const handleConnectStart = (
    e: React.MouseEvent<SVGCircleElement>,
    sourceNodeId: NodeId
  ) => {
    e.stopPropagation();
    const pos = toSvgPoint(e.clientX, e.clientY);
    dispatch({
      type: "SET_DRAG",
      payload: {
        kind: "creating-link",
        sourceNodeId,
        currentPosition: pos,
      },
    });
  };

  // ノードのmouseup → リンク作成完了
  const handleNodeMouseUp = (
    e: React.MouseEvent<SVGGElement>,
    nodeId: NodeId
  ) => {
    const d = dragRef.current;
    if (d.kind === "creating-link" && d.sourceNodeId !== nodeId) {
      dispatch({
        type: "ADD_LINK",
        payload: { nodeAId: d.sourceNodeId, nodeBId: nodeId },
      });
      dispatch({ type: "CLEAR_DRAG" });
    }
  };

  // ノード右クリック
  const handleNodeContextMenu = (
    e: React.MouseEvent<SVGGElement>,
    nodeId: NodeId
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: "SHOW_CONTEXT_MENU",
      payload: {
        visible: true,
        targetType: "node",
        targetId: nodeId,
        position: { x: e.clientX, y: e.clientY },
      },
    });
  };

  // リンク右クリック
  const handleLinkContextMenu = (
    e: React.MouseEvent<SVGLineElement>,
    linkId: LinkId
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: "SHOW_CONTEXT_MENU",
      payload: {
        visible: true,
        targetType: "link",
        targetId: linkId,
        position: { x: e.clientX, y: e.clientY },
      },
    });
  };

  const activeLinks = getActiveLinks(simulation);

  // リンク作成中のプレビューライン
  const renderDragLine = () => {
    if (drag.kind !== "creating-link") return null;
    const src = nodes.get(drag.sourceNodeId);
    if (!src) return null;
    const sx = src.position.x + NODE_W / 2;
    const sy = src.position.y + NODE_H / 2;
    return (
      <line
        x1={sx}
        y1={sy}
        x2={drag.currentPosition.x}
        y2={drag.currentPosition.y}
        stroke="#89b4fa"
        strokeWidth={2}
        strokeDasharray="6 3"
        pointerEvents="none"
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseDown={handleSvgMouseDown}
    >
      {/* グリッド背景 */}
      <defs>
        <pattern
          id="grid"
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="#313244"
            strokeWidth={0.5}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* リンク */}
      {Array.from(links.values()).map((link) => (
        <LinkItem
          key={link.id}
          link={link}
          nodes={nodes}
          isActive={activeLinks.has(link.id)}
          onContextMenu={(e) => handleLinkContextMenu(e, link.id)}
        />
      ))}

      {/* 作成中リンクのプレビュー */}
      {renderDragLine()}

      {/* ノード */}
      {Array.from(nodes.values()).map((node) => (
        <NodeItem
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isHovered={hoveredNodeId === node.id}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          onConnectStart={(e) => handleConnectStart(e, node.id)}
          onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
        />
      ))}
    </svg>
  );
}
