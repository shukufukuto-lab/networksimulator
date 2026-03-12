// =============================================================
// シミュレーションドメインロジック
// ホップ列→SimulationStep変換・SimulationState生成
// =============================================================

import { computePing, computeWeb } from "@/domain/routing";

// -------------------------------------------------------------
// 内部ユーティリティ
// -------------------------------------------------------------

/** 2ノード間のリンクを検索 */
function findLinkBetween(
  links: Map<LinkId, Link>,
  nodeA: NodeId,
  nodeB: NodeId
): Link | null {
  for (const link of links.values()) {
    if (
      (link.nodeA === nodeA && link.nodeB === nodeB) ||
      (link.nodeA === nodeB && link.nodeB === nodeA)
    ) {
      return link;
    }
  }
  return null;
}

/** ノード名を取得（不明な場合はIDを返す） */
function getNodeName(nodes: Map<NodeId, NetworkNode>, id: NodeId): string {
  return nodes.get(id)?.name ?? id;
}

/**
 * ホップ列（NodeId[]）を SimulationStep[] に変換する。
 * 連続する2ノード間のリンクが見つからない場合はそのホップをスキップする。
 */
function buildSteps(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  hops: NodeId[],
  commType: CommunicationType
): SimulationStep[] {
  const typeLabel =
    commType === "ping" ? "Ping" : commType === "dns" ? "DNS" : "HTTP";

  const outbound: SimulationStep[] = [];
  for (let i = 0; i < hops.length - 1; i++) {
    const from = hops[i];
    const to = hops[i + 1];
    const link = findLinkBetween(links, from, to);
    if (!link) continue;
    outbound.push({
      from,
      to,
      link: link.id,
      communicationType: commType,
      description: `${typeLabel}: ${getNodeName(nodes, from)} → ${getNodeName(nodes, to)}`,
      direction: "outbound",
    });
  }

  const returnSteps: SimulationStep[] = [];
  for (let i = hops.length - 1; i > 0; i--) {
    const from = hops[i];
    const to = hops[i - 1];
    const link = findLinkBetween(links, from, to);
    if (!link) continue;
    returnSteps.push({
      from,
      to,
      link: link.id,
      communicationType: commType,
      description: `${typeLabel}(応答): ${getNodeName(nodes, from)} → ${getNodeName(nodes, to)}`,
      direction: "return",
    });
  }

  return [...outbound, ...returnSteps];
}

// -------------------------------------------------------------
// 公開API
// -------------------------------------------------------------

/** 初期 SimulationState（idle状態） */
export const INITIAL_SIMULATION_STATE: SimulationState = {
  status: "idle",
  currentRequest: null,
  steps: [],
  currentStepIndex: 0,
};

/**
 * Pingシミュレーションを開始する。
 * 経路計算を行い、ステップ列を含む SimulationState を返す。
 */
export function startPingSimulation(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: PingRequest
): SimulationState {
  const pingResult = computePing(nodes, links, request);

  if (!pingResult.success || pingResult.hops.length === 0) {
    // 経路なし → 即 finished
    return {
      status: "finished",
      currentRequest: request,
      steps: [],
      currentStepIndex: 0,
    };
  }

  const steps = buildSteps(nodes, links, pingResult.hops, "ping");

  return {
    status: "paused",
    currentRequest: request,
    steps,
    currentStepIndex: 0,
  };
}

/**
 * Webアクセスシミュレーションを開始する。
 * DNS（dns通信）＋HTTP（web通信）のステップ列を含む SimulationState を返す。
 */
export function startWebSimulation(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: WebRequest
): SimulationState {
  const webResult = computeWeb(nodes, links, request);

  if (!webResult.success || webResult.hops.length === 0) {
    return {
      status: "finished",
      currentRequest: request,
      steps: [],
      currentStepIndex: 0,
    };
  }

  // Web通信ではhopsにDNSとHTTPが混在する。
  // 簡易的にすべてのホップを "web" 通信タイプとしてステップ化する。
  // より詳細なフェーズ分割は将来対応。
  const steps = buildSteps(nodes, links, webResult.hops, "web");

  return {
    status: "paused",
    currentRequest: request,
    steps,
    currentStepIndex: 0,
  };
}

/**
 * シミュレーションを1ステップ進める（「次へ」ボタン）。
 */
export function advanceSimulation(state: SimulationState): SimulationState {
  if (state.status !== "paused") return state;

  const nextIndex = state.currentStepIndex + 1;

  if (nextIndex >= state.steps.length) {
    // 全ステップ完了
    return {
      ...state,
      status: "finished",
      currentStepIndex: state.steps.length,
    };
  }

  return {
    ...state,
    currentStepIndex: nextIndex,
  };
}

/**
 * シミュレーションをリセットして初期状態に戻す。
 */
export function resetSimulation(): SimulationState {
  return INITIAL_SIMULATION_STATE;
}

/**
 * 現在表示中のアクティブなリンクIDセットを返す（アニメーション用）。
 * currentStepIndex までに経由したリンクを返す。
 */
export function getActiveLinks(state: SimulationState): Set<LinkId> {
  const active = new Set<LinkId>();
  if (state.status === "idle") return active;

  const end = Math.min(state.currentStepIndex + 1, state.steps.length);
  for (let i = 0; i < end; i++) {
    active.add(state.steps[i].link);
  }
  return active;
}

/**
 * Ping結果を取得（シミュレーション開始時に計算済み結果を別途表示するため）。
 */
export function getPingResult(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: PingRequest
): PingResult {
  return computePing(nodes, links, request);
}

/**
 * Web結果を取得（シミュレーション開始時に計算済み結果を別途表示するため）。
 */
export function getWebResult(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>,
  request: WebRequest
): WebResult {
  return computeWeb(nodes, links, request);
}
