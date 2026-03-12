import { computePing } from "@/domain/routing";

/**
 * 演習1 判定ロジック: VLAN制御
 * 条件:
 * 1. PC1 と PC2 は互いにPing疎通できる（同じVLAN）
 * 2. PC3 と PC4 は互いにPing疎通できる（同じVLAN）
 * 3. PC1/PC2 は PC3/PC4 にPing疎通できない（VLAN分離）
 */
export function judgeExercise1(
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
  const pc3 = findPc("PC3");
  const pc4 = findPc("PC4");

  if (!pc1 || !pc2 || !pc3 || !pc4) {
    return {
      status: "failure",
      reasons: ["PC1, PC2, PC3, PC4 がすべて存在する必要があります。"],
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

  // PC3 → PC4 疎通チェック
  const ping34 = computePing(nodes, links, {
    source: pc3.id,
    destination: pc4.ipAddress ?? "",
  });
  if (!ping34.success) {
    reasons.push("PC3 から PC4 に疎通できません。");
  }

  // PC4 → PC3 疎通チェック
  const ping43 = computePing(nodes, links, {
    source: pc4.id,
    destination: pc3.ipAddress ?? "",
  });
  if (!ping43.success) {
    reasons.push("PC4 から PC3 に疎通できません。");
  }

  // PC1 → PC3 疎通できてはいけない
  const ping13 = computePing(nodes, links, {
    source: pc1.id,
    destination: pc3.ipAddress ?? "",
  });
  if (ping13.success) {
    reasons.push("PC1 から PC3 に疎通できてはいけません（VLAN分離）。");
  }

  // PC1 → PC4 疎通できてはいけない
  const ping14 = computePing(nodes, links, {
    source: pc1.id,
    destination: pc4.ipAddress ?? "",
  });
  if (ping14.success) {
    reasons.push("PC1 から PC4 に疎通できてはいけません（VLAN分離）。");
  }

  // PC2 → PC3 疎通できてはいけない
  const ping23 = computePing(nodes, links, {
    source: pc2.id,
    destination: pc3.ipAddress ?? "",
  });
  if (ping23.success) {
    reasons.push("PC2 から PC3 に疎通できてはいけません（VLAN分離）。");
  }

  // PC2 → PC4 疎通できてはいけない
  const ping24 = computePing(nodes, links, {
    source: pc2.id,
    destination: pc4.ipAddress ?? "",
  });
  if (ping24.success) {
    reasons.push("PC2 から PC4 に疎通できてはいけません（VLAN分離）。");
  }

  if (reasons.length === 0) {
    return { status: "clear" };
  }
  return { status: "failure", reasons };
}
