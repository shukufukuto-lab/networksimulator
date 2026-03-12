"use client";

import React from "react";

// ExerciseAction is defined in ExerciseApp.tsx - use generic dispatch
interface Props {
  state: ExerciseState;
  dispatch: React.Dispatch<{ type: string; [key: string]: unknown }>;
}

export default function ExerciseCanvas({ state }: Props) {
  return (
    <div style={{ flex: 1, background: "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6c7086" }}>
        Canvas ({state.topology.nodes.size} ノード)
      </div>
    </div>
  );
}
