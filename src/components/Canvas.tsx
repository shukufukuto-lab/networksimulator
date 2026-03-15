"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import NodeItem, { NODE_W, NODE_H } from "@/components/NodeItem";
import LinkItem from "@/components/LinkItem";
import PortSelector from "@/components/simulator/PortSelector";
import PacketAnimation from "@/components/simulator/PacketAnimation";
import { getActiveLinks } from "@/domain/simulation";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Canvas.module.css";

interface Props {
  nodes: Map<NodeId, NetworkNode>;
  links: Map<LinkId, Link>;
  drag: DragState;
  linkCreation: LinkCreationState;
  simulation: SimulationState;
  selectedNodeId: NodeId | null;
  selectedLinkId: LinkId | null;
  simulationMode: SimulationMode;
  dispatch: React.Dispatch<Action>;
}

export default function Canvas({
  nodes,
  links,
  drag,
  linkCreation,
  simulation,
  selectedNodeId,
  selectedLinkId,
  simulationMode,
  dispatch,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<NodeId | null>(null);
  // ノードクリック時にソースポート選択を表示するためのstate
  const [pendingSourceNodeId, setPendingSourceNodeId] = useState<NodeId | null>(null);

  const dragRef = useRef(drag);
  dragRef.current = drag;
  const linkCreationRef = useRef(linkCreation);
  linkCreationRef.current = linkCreation;
  // クリック判定用（mousedown位置を記録）
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

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
            position: { x: pos.x - d.offset.x, y: pos.y - d.offset.y },
          },
        });
      }
      const lc = linkCreationRef.current;
      if (lc.step === "source-selected") {
        const pos = toSvgPoint(e.clientX, e.clientY);
        dispatch({ type: "SET_LINK_CREATION", payload: { ...lc, currentPosition: pos } });
      }
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (d.kind === "moving-node") dispatch({ type: "CLEAR_DRAG" });
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
      payload: { nodeType, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } },
    });
  };

  // SVG背景クリック → 選択解除 & キャンセル
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (e.target === svgRef.current) {
      dispatch({ type: "DESELECT_NODE" });
      dispatch({ type: "DESELECT_LINK" });
      dispatch({ type: "SET_LINK_CREATION", payload: { step: "idle" } });
      setPendingSourceNodeId(null);
    }
  };

  // ノードmousedown → 移動開始
  const handleNodeMouseDown = (
    e: React.MouseEvent<SVGRectElement>,
    nodeId: NodeId
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (linkCreationRef.current.step !== "idle") return;
    const pos = toSvgPoint(e.clientX, e.clientY);
    mouseDownPosRef.current = pos;
    const node = nodes.get(nodeId);
    if (!node) return;
    dispatch({ type: "SELECT_NODE", payload: { nodeId } });
    dispatch({ type: "DESELECT_LINK" });
    setPendingSourceNodeId(null);
    dispatch({
      type: "SET_DRAG",
      payload: {
        kind: "moving-node",
        nodeId,
        offset: { x: pos.x - node.position.x, y: pos.y - node.position.y },
        currentPosition: pos,
      },
    });
  };

  // ノードmouseup → クリック判定 or リンク作成ターゲット選択
  const handleNodeMouseUp = (
    e: React.MouseEvent<SVGGElement>,
    nodeId: NodeId
  ) => {
    const lc = linkCreationRef.current;

    // idle状態でクリック（移動量 < 8px）→ ソースポート選択ポップアップ表示
    if (lc.step === "idle" && mouseDownPosRef.current) {
      const currentPos = toSvgPoint(e.clientX, e.clientY);
      const dx = currentPos.x - mouseDownPosRef.current.x;
      const dy = currentPos.y - mouseDownPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        setPendingSourceNodeId(nodeId);
        return;
      }
    }

    if (lc.step !== "source-selected") return;
    if (lc.sourceNodeId === nodeId) return;

    const targetNode = nodes.get(nodeId);
    if (!targetNode) return;
    const availablePorts = targetNode.ports.filter((p) => p.linkedLinkId === null);
    if (availablePorts.length === 0) return;

    dispatch({
      type: "SET_LINK_CREATION",
      payload: {
        step: "target-node-selected",
        sourceNodeId: lc.sourceNodeId,
        sourcePortId: lc.sourcePortId,
        targetNodeId: nodeId,
        availablePorts,
      },
    });
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
      payload: { visible: true, targetType: "node", targetId: nodeId, position: { x: e.clientX, y: e.clientY } },
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
      payload: { visible: true, targetType: "link", targetId: linkId, position: { x: e.clientX, y: e.clientY } },
    });
  };

  // リンククリック → 選択
  const handleLinkClick = (linkId: LinkId) => {
    dispatch({ type: "SELECT_LINK", payload: { linkId } });
    setPendingSourceNodeId(null);
  };

  // リンクエンドポイントドラッグ → 再接続
  const handleEndpointMouseDown = (
    e: React.MouseEvent<SVGCircleElement>,
    link: Link,
    isEndpointA: boolean
  ) => {
    e.stopPropagation();
    const pos = toSvgPoint(e.clientX, e.clientY);
    dispatch({ type: "DELETE_LINK", payload: { linkId: link.id } });
    const sourceNodeId = isEndpointA ? link.nodeB : link.nodeA;
    const sourcePortId = isEndpointA ? link.portB : link.portA;
    dispatch({
      type: "SET_LINK_CREATION",
      payload: { step: "source-selected", sourceNodeId, sourcePortId, currentPosition: pos },
    });
  };

  const activeLinks = getActiveLinks(simulation);

  // リンク作成中のプレビューライン
  const renderDragLine = () => {
    if (linkCreation.step !== "source-selected") return null;
    const src = nodes.get(linkCreation.sourceNodeId);
    if (!src) return null;
    return (
      <line
        x1={src.position.x + NODE_W / 2}
        y1={src.position.y + NODE_H / 2}
        x2={linkCreation.currentPosition.x}
        y2={linkCreation.currentPosition.y}
        stroke="#89b4fa"
        strokeWidth={2}
        strokeDasharray="6 3"
        pointerEvents="none"
      />
    );
  };

  // ソースポート選択ポップアップ（ノードクリック時）
  const renderSourcePortSelector = () => {
    if (!pendingSourceNodeId) return null;
    const node = nodes.get(pendingSourceNodeId);
    if (!node) return null;
    const availablePorts = node.ports.filter((p) => p.linkedLinkId === null);
    if (availablePorts.length === 0) return null;
    const px = node.position.x + NODE_W + 8;
    const py = node.position.y;
    return (
      <foreignObject x={px} y={py} width={180} height={300} style={{ overflow: "visible" }}>
        <PortSelector
          ports={availablePorts}
          onSelect={(portId) => {
            dispatch({
              type: "SET_LINK_CREATION",
              payload: {
                step: "source-selected",
                sourceNodeId: pendingSourceNodeId,
                sourcePortId: portId,
                currentPosition: {
                  x: node.position.x + NODE_W / 2,
                  y: node.position.y + NODE_H / 2,
                },
              },
            });
            setPendingSourceNodeId(null);
          }}
          onCancel={() => setPendingSourceNodeId(null)}
        />
      </foreignObject>
    );
  };

  // パケットアニメーション
  const renderPacketAnimation = () => {
    if (simulationMode !== "on") return null;
    if (simulation.status !== "paused") return null;
    const currentStep = simulation.steps[simulation.currentStepIndex];
    if (!currentStep) return null;
    const fromNode = nodes.get(currentStep.from);
    const toNode = nodes.get(currentStep.to);
    if (!fromNode || !toNode) return null;
    return (
      <PacketAnimation
        step={currentStep}
        fromPosition={{ x: fromNode.position.x + NODE_W / 2, y: fromNode.position.y + NODE_H / 2 }}
        toPosition={{ x: toNode.position.x + NODE_W / 2, y: toNode.position.y + NODE_H / 2 }}
        onComplete={() => {}}
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
      <defs>
        <pattern id="grid" width={24} height={24} patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#313244" strokeWidth={0.5} />
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
          isSelected={selectedLinkId === link.id}
          onClick={() => handleLinkClick(link.id)}
          onContextMenu={(e) => handleLinkContextMenu(e, link.id)}
          onEndpointMouseDown={(e, isA) => handleEndpointMouseDown(e, link, isA)}
        />
      ))}

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
          onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
        />
      ))}

      {/* ソースポート選択 */}
      {renderSourcePortSelector()}

      {/* ターゲットポート選択 */}
      {linkCreation.step === "target-node-selected" && (() => {
        const targetNode = nodes.get(linkCreation.targetNodeId);
        if (!targetNode) return null;
        const px = targetNode.position.x + NODE_W + 8;
        const py = targetNode.position.y;
        return (
          <foreignObject x={px} y={py} width={180} height={300} style={{ overflow: "visible" }}>
            <PortSelector
              ports={linkCreation.availablePorts}
              onSelect={(portId) => {
                dispatch({
                  type: "ADD_LINK",
                  payload: {
                    nodeAId: linkCreation.sourceNodeId,
                    portAId: linkCreation.sourcePortId,
                    nodeBId: linkCreation.targetNodeId,
                    portBId: portId,
                  },
                });
                dispatch({ type: "SET_LINK_CREATION", payload: { step: "idle" } });
              }}
              onCancel={() => dispatch({ type: "SET_LINK_CREATION", payload: { step: "idle" } })}
            />
          </foreignObject>
        );
      })()}

      {renderPacketAnimation()}
    </svg>
  );
}
