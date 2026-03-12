"use client";

interface Props {
  onAnswer: () => void;
}

export default function ExerciseBar({ onAnswer }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 16px",
        background: "#181825",
        borderTop: "1px solid #313244",
      }}
    >
      <button
        onClick={onAnswer}
        style={{
          background: "#89b4fa",
          color: "#1e1e2e",
          border: "none",
          borderRadius: "6px",
          padding: "8px 24px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        答え合わせ
      </button>
    </div>
  );
}
