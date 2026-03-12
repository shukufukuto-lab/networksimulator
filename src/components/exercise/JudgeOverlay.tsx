"use client";

import Link from "next/link";

interface Props {
  result: JudgeResult;
  onRetry: () => void;
}

export default function JudgeOverlay({ result, onRetry }: Props) {
  if (result.status === "clear") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <div
          style={{
            background: "#1e1e2e",
            border: "2px solid #a6e3a1",
            borderRadius: "12px",
            padding: "40px 60px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", fontWeight: 900, color: "#a6e3a1", marginBottom: "16px" }}>
            CLEAR!!
          </div>
          <Link
            href="/exercises"
            style={{
              display: "inline-block",
              background: "#89b4fa",
              color: "#1e1e2e",
              borderRadius: "6px",
              padding: "8px 24px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            演習一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#1e1e2e",
          border: "2px solid #f38ba8",
          borderRadius: "12px",
          padding: "32px 48px",
          textAlign: "center",
          maxWidth: "480px",
          width: "90%",
        }}
      >
        <div style={{ fontSize: "40px", fontWeight: 900, color: "#f38ba8", marginBottom: "16px" }}>
          NG
        </div>
        <ul style={{ textAlign: "left", color: "#cdd6f4", marginBottom: "20px", paddingLeft: "20px" }}>
          {result.reasons.map((r, i) => (
            <li key={i} style={{ marginBottom: "8px", fontSize: "13px" }}>
              {r}
            </li>
          ))}
        </ul>
        <button
          onClick={onRetry}
          style={{
            background: "#f38ba8",
            color: "#1e1e2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 24px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          もう一度
        </button>
      </div>
    </div>
  );
}
