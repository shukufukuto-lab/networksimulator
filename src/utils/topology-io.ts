"use client";

/** トポロジをJSONファイルとしてダウンロードする */
export function saveTopology(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>
): void {
  const topo: TopologyJson = {
    version: "1.0",
    savedAt: new Date().toISOString(),
    nodes: Array.from(nodes.values()),
    links: Array.from(links.values()),
  };
  const json = JSON.stringify(topo, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `topology-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** JSONファイルからトポロジを読み込む */
export async function loadTopologyFromFile(
  file: File
): Promise<TopologyJson | null> {
  try {
    const text = await file.text();
    const topo = JSON.parse(text) as TopologyJson;
    if (topo.version !== "1.0") return null;
    return topo;
  } catch {
    return null;
  }
}
