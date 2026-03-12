"use client";

interface Props {
  restriction: ExerciseNodeRestriction;
  nodeCount: Partial<Record<NodeType, number>>;
  onAddNode: (type: NodeType) => void;
}

const TYPE_LABELS: Record<NodeType, string> = {
  router: "Router",
  switch: "Switch",
  pc: "PC",
  server: "Server",
  "dns-server": "DNS",
};

export default function ExercisePalette({ restriction, nodeCount, onAddNode }: Props) {
  if (restriction.allowedNodeTypes.length === 0) return null;

  return (
    <aside
      style={{
        width: "120px",
        background: "#181825",
        borderRight: "1px solid #313244",
        padding: "16px 8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ color: "#6c7086", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
        ノード追加
      </div>
      {restriction.allowedNodeTypes.map((type) => {
        const maxCount = restriction.maxCount[type];
        const currentCount = nodeCount[type] ?? 0;
        const isDisabled = maxCount !== undefined && currentCount >= maxCount;

        return (
          <button
            key={type}
            onClick={() => !isDisabled && onAddNode(type)}
            disabled={isDisabled}
            style={{
              background: isDisabled ? "#313244" : "#1e1e2e",
              color: isDisabled ? "#6c7086" : "#cdd6f4",
              border: "1px solid #313244",
              borderRadius: "6px",
              padding: "8px",
              cursor: isDisabled ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {TYPE_LABELS[type]}
            {maxCount !== undefined && (
              <span style={{ fontSize: "10px", display: "block", color: "#6c7086" }}>
                {currentCount}/{maxCount}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
