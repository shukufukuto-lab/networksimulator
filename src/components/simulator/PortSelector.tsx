"use client";

interface PortSelectorProps {
  ports: Port[];
  onSelect: (portId: PortId) => void;
  onCancel: () => void;
}

export default function PortSelector({ ports, onSelect, onCancel }: PortSelectorProps) {
  const available = ports.filter((p) => p.linkedLinkId === null);

  if (available.length === 0) {
    return (
      <div style={{ padding: "8px", background: "#1e1e2e", border: "1px solid #89b4fa", borderRadius: "4px" }}>
        <p style={{ color: "#cdd6f4", margin: "0 0 8px" }}>空きポートがありません</p>
        <button onClick={onCancel} style={{ cursor: "pointer" }}>キャンセル</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px", background: "#1e1e2e", border: "1px solid #89b4fa", borderRadius: "4px" }}>
      <p style={{ color: "#cdd6f4", margin: "0 0 8px", fontSize: "12px" }}>ポートを選択</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {available.map((port) => (
          <li key={port.id}>
            <button
              onClick={() => onSelect(port.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                color: "#89b4fa",
                cursor: "pointer",
                padding: "4px 8px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {port.name}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onCancel}
        style={{ marginTop: "4px", cursor: "pointer", fontSize: "11px" }}
      >
        キャンセル
      </button>
    </div>
  );
}
