import ExerciseCardItem from "@/components/exercise/ExerciseCard";
import { EXERCISE_LIST } from "@/domain/exercises/exercise-list";

export default function ExercisesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#1e1e2e",
        padding: "40px 24px",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ color: "#cdd6f4", fontSize: "28px", fontWeight: 900, marginBottom: "32px" }}>
        演習一覧
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
        {EXERCISE_LIST.map((card) => (
          <ExerciseCardItem key={card.id} card={card} />
        ))}
      </div>
    </main>
  );
}
