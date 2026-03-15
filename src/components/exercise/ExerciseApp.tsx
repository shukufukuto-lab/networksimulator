"use client";

import { useReducer } from "react";
import ExercisePalette from "@/components/exercise/ExercisePalette";
import ExerciseCanvas from "@/components/exercise/ExerciseCanvas";
import ExerciseBar from "@/components/exercise/ExerciseBar";
import JudgeOverlay from "@/components/exercise/JudgeOverlay";
import { addNode, addLink, deleteLink } from "@/domain/topology";
import { judgeExercise1 } from "@/domain/exercises/exercise1-judge";
import { judgeExercise2 } from "@/domain/exercises/exercise2-judge";
import { INITIAL_SIMULATION_STATE } from "@/domain/simulation";
import { createInitialPorts } from "@/utils/node-factory";
import { generateNodeId } from "@/utils/id-generator";

// ----------------------------------------------------------------
// ExerciseAction 型定義
// ----------------------------------------------------------------
export type ExerciseAction =
  | { type: "ADD_NODE"; payload: { nodeType: NodeType; position: { x: number; y: number } } }
  | { type: "DELETE_NODE"; payload: { nodeId: NodeId } }
  | { type: "MOVE_NODE"; payload: { nodeId: NodeId; position: { x: number; y: number } } }
  | { type: "UPDATE_NODE"; payload: { node: NetworkNode } }
  | {
      type: "ADD_LINK";
      payload: { nodeAId: NodeId; portAId: PortId; nodeBId: NodeId; portBId: PortId };
    }
  | { type: "DELETE_LINK"; payload: { linkId: LinkId } }
  | { type: "SET_DRAG"; payload: DragState }
  | { type: "CLEAR_DRAG" }
  | { type: "SET_LINK_CREATION"; payload: LinkCreationState }
  | { type: "SHOW_CONTEXT_MENU"; payload: Extract<ContextMenu, { visible: true }> }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SELECT_NODE"; payload: { nodeId: NodeId } }
  | { type: "DESELECT_NODE" }
  | { type: "JUDGE" }
  | { type: "RETRY" };

// ----------------------------------------------------------------
// ノード生成ヘルパー
// ----------------------------------------------------------------

function makePcNode(name: string, position: { x: number; y: number }, ipAddress?: IpAddress, subnetMask?: SubnetMask): PC {
  const id = generateNodeId();
  const ports = createInitialPorts("pc");
  return {
    id,
    type: "pc",
    name,
    position,
    ports,
    ipAddress: ipAddress ?? null,
    subnetMask: subnetMask ?? null,
    defaultGateway: null,
    dnsServer: null,
  };
}

function makeSwitchNode(name: string, position: { x: number; y: number }): Switch {
  const id = generateNodeId();
  const ports = createInitialPorts("switch");
  return {
    id,
    type: "switch",
    name,
    position,
    ports,
    ipAddress: null,
    subnetMask: null,
    vlans: [],
    configText: "",
  };
}

// ----------------------------------------------------------------
// 演習1 初期状態
// ----------------------------------------------------------------
function buildExercise1InitialState(): ExerciseState {
  const pc1 = makePcNode("PC1", { x: 200, y: 150 });
  const pc2 = makePcNode("PC2", { x: 600, y: 150 });
  const pc3 = makePcNode("PC3", { x: 200, y: 450 });
  const pc4 = makePcNode("PC4", { x: 600, y: 450 });
  const sw1 = makeSwitchNode("Switch1", { x: 400, y: 300 });

  const nodes = new Map<NodeId, NetworkNode>([
    [pc1.id, pc1],
    [pc2.id, pc2],
    [pc3.id, pc3],
    [pc4.id, pc4],
    [sw1.id, sw1],
  ]);

  return {
    exerciseId: 1,
    topology: { nodes, links: new Map() },
    simulation: INITIAL_SIMULATION_STATE,
    drag: { kind: "none" },
    linkCreation: { step: "idle" },
    contextMenu: { visible: false },
    selectedNodeId: null,
    restriction: {
      allowedNodeTypes: [],
      maxCount: {},
      fixedNodeIds: [pc1.id, pc2.id, pc3.id, pc4.id, sw1.id],
      lockedIpNodeIds: [],
    },
    judgeResult: null,
  };
}

// ----------------------------------------------------------------
// 演習2 初期状態
// ----------------------------------------------------------------
function buildExercise2InitialState(): ExerciseState {
  const pc1 = makePcNode(
    "PC1",
    { x: 150, y: 300 },
    "192.168.1.1" as IpAddress,
    "255.255.255.0" as SubnetMask
  );
  const pc2 = makePcNode(
    "PC2",
    { x: 650, y: 300 },
    "192.168.2.1" as IpAddress,
    "255.255.255.0" as SubnetMask
  );

  const nodes = new Map<NodeId, NetworkNode>([
    [pc1.id, pc1],
    [pc2.id, pc2],
  ]);

  return {
    exerciseId: 2,
    topology: { nodes, links: new Map() },
    simulation: INITIAL_SIMULATION_STATE,
    drag: { kind: "none" },
    linkCreation: { step: "idle" },
    contextMenu: { visible: false },
    selectedNodeId: null,
    restriction: {
      allowedNodeTypes: ["router", "switch"],
      maxCount: { router: 1, switch: 2 },
      fixedNodeIds: [pc1.id, pc2.id],
      lockedIpNodeIds: [pc1.id, pc2.id],
    },
    judgeResult: null,
  };
}

// ----------------------------------------------------------------
// Reducer
// ----------------------------------------------------------------
function reducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
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
      // 固定ノードは削除不可
      if (state.restriction.fixedNodeIds.includes(action.payload.nodeId)) {
        return state;
      }
      const newNodes = new Map(state.topology.nodes);
      newNodes.delete(action.payload.nodeId);
      return {
        ...state,
        topology: { ...state.topology, nodes: newNodes },
        selectedNodeId:
          state.selectedNodeId === action.payload.nodeId
            ? null
            : state.selectedNodeId,
      };
    }
    case "MOVE_NODE": {
      if (state.restriction.fixedNodeIds.includes(action.payload.nodeId)) {
        return state;
      }
      const node = state.topology.nodes.get(action.payload.nodeId);
      if (!node) return state;
      const newNodes = new Map(state.topology.nodes);
      newNodes.set(action.payload.nodeId, { ...node, position: action.payload.position } as NetworkNode);
      return { ...state, topology: { ...state.topology, nodes: newNodes } };
    }
    case "UPDATE_NODE": {
      const newNodes = new Map(state.topology.nodes);
      newNodes.set(action.payload.node.id, action.payload.node);
      return { ...state, topology: { ...state.topology, nodes: newNodes } };
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
        linkCreation: { step: "idle" },
      };
    }
    case "DELETE_LINK": {
      const { nodes, links } = deleteLink(
        state.topology.nodes,
        state.topology.links,
        action.payload.linkId
      );
      return { ...state, topology: { nodes, links } };
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
      return { ...state, selectedNodeId: action.payload.nodeId, contextMenu: { visible: false } };
    case "DESELECT_NODE":
      return { ...state, selectedNodeId: null };
    case "JUDGE": {
      const judgeFn =
        state.exerciseId === 1 ? judgeExercise1 : judgeExercise2;
      const judgeResult = judgeFn(state.topology.nodes, state.topology.links);
      return { ...state, judgeResult };
    }
    case "RETRY":
      return { ...state, judgeResult: null };
  }
}

// ----------------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------------
interface Props {
  exerciseId: number;
}

export default function ExerciseApp({ exerciseId }: Props) {
  const initialState =
    exerciseId === 1 ? buildExercise1InitialState() : buildExercise2InitialState();

  const [state, dispatch] = useReducer(reducer, initialState);

  // 現在のノード種別カウント
  const nodeCount: Partial<Record<NodeType, number>> = {};
  for (const node of state.topology.nodes.values()) {
    nodeCount[node.type] = (nodeCount[node.type] ?? 0) + 1;
  }

  const handleAddNode = (type: NodeType) => {
    dispatch({
      type: "ADD_NODE",
      payload: { nodeType: type, position: { x: 400, y: 300 } },
    });
  };

  const handleAnswer = () => {
    dispatch({ type: "JUDGE" });
  };

  const handleRetry = () => {
    dispatch({ type: "RETRY" });
  };

  // ExerciseCanvas uses generic dispatch - we cast
  const genericDispatch = dispatch as React.Dispatch<{ type: string; [key: string]: unknown }>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e2e", overflow: "hidden" }}>
      <header style={{ padding: "10px 16px", background: "#181825", borderBottom: "1px solid #313244", flexShrink: 0 }}>
        <span style={{ color: "#cdd6f4", fontWeight: 700 }}>
          演習 {exerciseId}: {exerciseId === 1 ? "VLAN制御" : "ルーティング設定"}
        </span>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ExercisePalette
          restriction={state.restriction}
          nodeCount={nodeCount}
          onAddNode={handleAddNode}
        />
        <ExerciseCanvas state={state} dispatch={genericDispatch} />
      </div>

      <ExerciseBar onAnswer={handleAnswer} />

      {state.judgeResult !== null && (
        <JudgeOverlay result={state.judgeResult} onRetry={handleRetry} />
      )}
    </div>
  );
}
