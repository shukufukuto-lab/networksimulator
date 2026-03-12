"use client";

import Link from "next/link";

interface Props {
  card: ExerciseCard;
}

const DIFFICULTY_COLORS: Record<ExerciseDifficulty, string> = {
  初級: "#a6e3a1",
  中級: "#f9e2af",
  上級: "#f38ba8",
};

export default function ExerciseCardItem({ card }: Props) {
  const badgeColor = DIFFICULTY_COLORS[card.difficulty];

  return (
    <Link href={card.path} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#1e1e2e",
          border: "1px solid #313244",
          borderRadius: "8px",
          padding: "16px",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span
            style={{
              background: badgeColor,
              color: "#1e1e2e",
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            {card.difficulty}
          </span>
          <span style={{ color: "#cdd6f4", fontWeight: 600, fontSize: "16px" }}>
            {card.title}
          </span>
        </div>
        <p style={{ color: "#6c7086", fontSize: "13px", margin: 0 }}>
          {card.description}
        </p>
      </div>
    </Link>
  );
}
