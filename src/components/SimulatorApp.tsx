"use client";

import { useReducer, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Palette from "@/components/Palette";
import Canvas from "@/components/Canvas";
import ContextMenu from "@/components/ContextMenu";
import SimulationBar from "@/components/SimulationBar";
import RouterDetail from "@/components/detail/RouterDetail";
import SwitchDetail from "@/components/detail/SwitchDetail";
import PcDetail from "@/components/detail/PcDetail";
import ServerDetail from "@/components/detail/ServerDetail";
import DnsDetail from "@/components/detail/DnsDetail";
import {
  addNode,
  deleteNode,
  moveNode,
  updateNode,
  addLink,
  deleteLink,
} from "@/domain/topology";
import {
  startPingSimulation,
  startWebSimulation,
  advanceSimulation,
  resetSimulation,
  INITIAL_SIMULATION_STATE,
} from "@/domain/simulation";
import { saveTopology, loadTopologyFromFile } from "@/utils/topology-io";
import styles from "./SimulatorApp.module.css";

// ----------------------------------------------------------------
// パレットアイテム（固定）
// ----------------------------------------------------------------
const PALETTE_ITEMS: PaletteItem[] = [
  { nodeType: "router", label: "Router", iconName: "MdRouter" },
  { nodeType: "switch", label: "Switch", iconName: "MdDeviceHub" },
  { nodeType: "pc", label: "PC", iconName: "MdComputer" },
  { nodeType: "server", label: "Server", iconName: "MdStorage" },
  { nodeType: "dns-server", label: "DNS", iconName: "MdPublic" },
];

// ----------------------------------------------------------------
// Actionの型定義
// ----------------------------------------------------------------
export type Action =
  | {
      type: "ADD_NODE";
      payload: { nodeType: NodeType; position: { x: number; y: number } };
    }
  | { type: "DELETE_NODE"; payload: { nodeId: NodeId } }
  | {
      type: "MOVE_NODE";
      payload: { nodeId: NodeId; position: { x: number; y: number } };
    }
  | { type: "UPDATE_NODE"; payload: { node: NetworkNode } }
  | {
      type: "ADD_LINK";
      payload: {
        nodeAId: NodeId;
        portAId: PortId;
        nodeBId: NodeId;
        portBId: PortId;
      };
    }
  | { type: "DELETE_LINK"; payload: { linkId: LinkId } }
  | { type: "SET_DRAG"; payload: DragState }
  | { type: "CLEAR_DRAG" }
  | { type: "SET_LINK_CREATION"; payload: LinkCreationState }
  | {
      type: "SHOW_CONTEXT_MENU";
      payload: Extract<ContextMenu, { visible: true }>;
    }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SELECT_NODE"; payload: { nodeId: NodeId } }
  | { type: "DESELECT_NODE" }
  | { type: "START_SIMULATION"; payload: PingRequest | WebRequest }
  | { type: "NEXT_STEP" }
  | { type: "RESET_SIMULATION" }
  | { type: "LOAD_TOPOLOGY"; payload: TopologyJson };

// ----------------------------------------------------------------
// 初期状態
// ----------------------------------------------------------------
const initialState: AppState = {
  topology: {
    nodes: new Map<NodeId, NetworkNode>(),
    links: new Map<LinkId, Link>(),
  },
  simulation: INITIAL_SIMULATION_STATE,
  drag: { kind: "none" },
  linkCreation: { step: "idle" },
  contextMenu: { visible: false },
  selectedNodeId: null,
  palette: PALETTE_ITEMS,
};

// ----------------------------------------------------------------
// Reducer
// ----------------------------------------------------------------
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_NODE": {
      const { nodes } = addNode(
        state.topology.nodes,
        action.payload.nodeType,
        action.payload.position
      );
      return { ...state, topology: { ...state.topology, nodes } };
    }
    case "DELETE_NODE": {
      const { nodes, links } = deleteNode(
        state.topology.nodes,
        state.topology.links,
        action.payload.nodeId
      );
      return {
        ...state,
        topology: { nodes, links },
        contextMenu: { visible: false },
        selectedNodeId:
          state.selectedNodeId === action.payload.nodeId
            ? null
            : state.selectedNodeId,
        simulation: INITIAL_SIMULATION_STATE,
      };
    }
    case "MOVE_NODE": {
      const nodes = moveNode(
        state.topology.nodes,
        action.payload.nodeId,
        action.payload.position
      );
      return { ...state, topology: { ...state.topology, nodes } };
    }
    case "UPDATE_NODE": {
      const nodes = updateNode(state.topology.nodes, action.payload.node);
      return { ...state, topology: { ...state.topology, nodes } };
    }
    case "ADD_LINK": {
      const result = addLink(
        state.topology.nodes,
        state.topology.links,
        action.payload.nodeAId,
        action.payload.portAId,
        action.payload.nodeBId,
        action.payload.portBId
      );
      if (!result) return state;
      return {
        ...state,
        topology: { nodes: result.nodes, links: result.links },
        simulation: INITIAL_SIMULATION_STATE,
        linkCreation: { step: "idle" },
      };
    }
    case "DELETE_LINK": {
      const { nodes, links } = deleteLink(
        state.topology.nodes,
        state.topology.links,
        action.payload.linkId
      );
      return {
        ...state,
        topology: { nodes, links },
        contextMenu: { visible: false },
        simulation: INITIAL_SIMULATION_STATE,
      };
    }
    case "SET_DRAG":
      return { ...state, drag: action.payload };
    case "CLEAR_DRAG":
      return { ...state, drag: { kind: "none" } };
    case "SET_LINK_CREATION":
      return { ...state, linkCreation: action.payload };
    case "SHOW_CONTEXT_MENU":
      return { ...state, contextMenu: action.payload };
    case "HIDE_CONTEXT_MENU":
      return { ...state, contextMenu: { visible: false } };
    case "SELECT_NODE":
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
        contextMenu: { visible: false },
      };
    case "DESELECT_NODE":
      return { ...state, selectedNodeId: null };
    case "START_SIMULATION": {
      const req = action.payload;
      const simState =
        "url" in req
          ? startWebSimulation(
              state.topology.nodes,
              state.topology.links,
              req
            )
          : startPingSimulation(
              state.topology.nodes,
              state.topology.links,
              req
            );
      return { ...state, simulation: simState };
    }
    case "NEXT_STEP":
      return { ...state, simulation: advanceSimulation(state.simulation) };
    case "RESET_SIMULATION":
      return { ...state, simulation: resetSimulation() };
    case "LOAD_TOPOLOGY": {
      const topo = action.payload;
      const nodes = new Map<NodeId, NetworkNode>(
        topo.nodes.map((n) => [n.id, n])
      );
      const links = new Map<LinkId, Link>(
        topo.links.map((l) => [l.id, l])
      );
      return {
        ...state,
        topology: { nodes, links },
        simulation: INITIAL_SIMULATION_STATE,
        selectedNodeId: null,
        contextMenu: { visible: false },
        drag: { kind: "none" },
        linkCreation: { step: "idle" },
      };
    }
  }
}

// ----------------------------------------------------------------
// ルートコンポーネント
// ----------------------------------------------------------------
export default function SimulatorApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // グローバルクリックでコンテキストメニューを閉じる
  useEffect(() => {
    const close = () => dispatch({ type: "HIDE_CONTEXT_MENU" });
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleSave = useCallback(() => {
    saveTopology(state.topology.nodes, state.topology.links);
  }, [state.topology]);

  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const topo = await loadTopologyFromFile(file);
      if (topo) dispatch({ type: "LOAD_TOPOLOGY", payload: topo });
      e.target.value = "";
    },
    []
  );

  const selectedNode = state.selectedNodeId
    ? state.topology.nodes.get(state.selectedNodeId) ?? null
    : null;

  return (
    <div className={styles.app}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <Link href="/" className={styles.titleLink}>Network Simulator</Link>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={handleSave}>
            保存
          </button>
          <button className={styles.headerBtn} onClick={handleLoadClick}>
            読み込み
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </header>

      {/* メインレイアウト */}
      <div className={styles.content}>
        {/* 左パネル: パレット */}
        <Palette items={state.palette} dispatch={dispatch} />

        {/* 中央: キャンバス + シミュレーションバー */}
        <div className={styles.center}>
          <Canvas
            nodes={state.topology.nodes}
            links={state.topology.links}
            drag={state.drag}
            linkCreation={state.linkCreation}
            simulation={state.simulation}
            selectedNodeId={state.selectedNodeId}
            dispatch={dispatch}
          />
          <SimulationBar simulation={state.simulation} dispatch={dispatch} />
        </div>

        {/* 右パネル: 設定パネル */}
        <aside className={styles.detail}>
          {selectedNode === null ? (
            <div className={styles.noSelection}>
              <p>ノードを右クリックして</p>
              <p>「設定」を選択</p>
            </div>
          ) : selectedNode.type === "router" ? (
            <RouterDetail
              node={selectedNode}
              nodes={state.topology.nodes}
              links={state.topology.links}
              dispatch={dispatch}
            />
          ) : selectedNode.type === "switch" ? (
            <SwitchDetail node={selectedNode} dispatch={dispatch} />
          ) : selectedNode.type === "pc" ? (
            <PcDetail
              node={selectedNode}
              nodes={state.topology.nodes}
              links={state.topology.links}
              dispatch={dispatch}
            />
          ) : selectedNode.type === "server" ? (
            <ServerDetail node={selectedNode} dispatch={dispatch} />
          ) : (
            <DnsDetail node={selectedNode} dispatch={dispatch} />
          )}
        </aside>
      </div>

      {/* コンテキストメニュー */}
      {state.contextMenu.visible && (
        <ContextMenu contextMenu={state.contextMenu} dispatch={dispatch} />
      )}
    </div>
  );
}
