import { computePing } from "@/domain/routing";

/**
 * 演習2 判定ロジック: ルーティング設定
 * 条件:
 * 1. PC1 と PC2 は互いにPing疎通できる
 * 2. 経路にルーターが含まれる
 */
export function judgeExercise2(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>
): JudgeResult {
  // ノード名で各PCを検索
  const findPc = (name: string): PC | null => {
    for (const node of nodes.values()) {
      if (node.name === name && node.type === "pc") return node;
    }
    return null;
  };

  const pc1 = findPc("PC1");
  const pc2 = findPc("PC2");

  if (!pc1 || !pc2) {
    return {
      status: "failure",
      reasons: ["PC1, PC2 がすべて存在する必要があります。"],
    };
  }

  const reasons: string[] = [];

  // PC1 → PC2 疎通チェック
  const ping12 = computePing(nodes, links, {
    source: pc1.id,
    destination: pc2.ipAddress ?? "",
  });
  if (!ping12.success) {
    reasons.push("PC1 から PC2 に疎通できません。");
  }

  // PC2 → PC1 疎通チェック
  const ping21 = computePing(nodes, links, {
    source: pc2.id,
    destination: pc1.ipAddress ?? "",
  });
  if (!ping21.success) {
    reasons.push("PC2 から PC1 に疎通できません。");
  }

  // 経路にルーターが含まれるか確認
  if (ping12.success && ping12.hops.length > 0) {
    const hasRouter = ping12.hops.some((hopId) => {
      const node = nodes.get(hopId);
      return node?.type === "router";
    });
    if (!hasRouter) {
      reasons.push("経路にルーターが含まれていません。ルーターを経由して接続してください。");
    }
  }

  if (reasons.length === 0) {
    return { status: "clear" };
  }
  return { status: "failure", reasons };
}
