import Link from "next/link";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#1e1e2e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ color: "#cdd6f4", fontSize: "32px", fontWeight: 900, margin: 0 }}>
        Network Simulator
      </h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        <Link
          href="/simulation"
          style={{
            display: "block",
            background: "#89b4fa",
            color: "#1e1e2e",
            borderRadius: "8px",
            padding: "12px 32px",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          自由シミュレーション
        </Link>
        <Link
          href="/exercises"
          style={{
            display: "block",
            background: "#a6e3a1",
            color: "#1e1e2e",
            borderRadius: "8px",
            padding: "12px 32px",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          演習モード
        </Link>
      </nav>
    </main>
  );
}
