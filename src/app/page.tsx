import Link from "next/link";
import ExerciseCardItem from "@/components/exercise/ExerciseCard";
import { EXERCISE_LIST } from "@/domain/exercises/exercise-list";
import styles from "./page.module.css";

const FEATURES = [
  {
    emoji: "🎯",
    title: "ステップ実行",
    desc: "1ホップずつ通信を進めることで、パケットがどのノードを経由しているかをリアルタイムで確認できます。",
  },
  {
    emoji: "🔧",
    title: "実機に近いConfig設定",
    desc: "Ciscoコンフィグ形式でルーターやスイッチの設定を入力できます。実機操作の感覚を学習段階から身につけられます。",
  },
  {
    emoji: "📚",
    title: "演習問題で実力確認",
    desc: "VLANやルーティングなどのテーマ別演習で、知識を実践的なスキルに変換できます。",
  },
] as const;

/** ネットワークトポロジを想起させる幾何学的SVG背景 */
function HeroBg() {
  const nodes = [
    { cx: "10%", cy: "20%", d: "0s" },
    { cx: "85%", cy: "15%", d: "0.8s" },
    { cx: "20%", cy: "75%", d: "1.4s" },
    { cx: "75%", cy: "70%", d: "0.4s" },
    { cx: "50%", cy: "45%", d: "1.1s" },
    { cx: "35%", cy: "30%", d: "0.6s" },
    { cx: "65%", cy: "35%", d: "1.7s" },
  ];

  const edges = [
    [0, 5], [5, 4], [4, 6], [6, 1],
    [4, 2], [4, 3], [5, 2], [6, 3],
  ];

  // SVG 内では % 指定が使えないため固定座標で計算
  const pts = [
    { x: 120, y: 120 },
    { x: 1020, y: 90 },
    { x: 240, y: 450 },
    { x: 900, y: 420 },
    { x: 600, y: 270 },
    { x: 420, y: 180 },
    { x: 780, y: 210 },
  ];

  return (
    <svg
      className={styles.heroBg}
      viewBox="0 0 1200 540"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={pts[a].x} y1={pts[a].y}
          x2={pts[b].x} y2={pts[b].y}
          stroke="#89b4fa"
          strokeWidth="1"
          style={{
            animation: `linkFade 3s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="#89b4fa"
          style={{
            animation: `nodePulse 4s ease-in-out ${nodes[i].d} infinite`,
          }}
        />
      ))}
    </svg>
  );
}

export default function TopPage() {
  return (
    <div className={styles.page}>
      {/* ① ヒーローセクション */}
      <section className={styles.hero}>
        <HeroBg />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Network Learning Simulator</span>
          <h1 className={styles.heroTitle}>
            パケットの動きを、<br />目で学ぶ。
          </h1>
          <p className={styles.heroSub}>
            ネットワーク初学者のための学習シミュレーター。<br />
            実際の通信の流れをリアルタイムに可視化することで、<br />
            教科書では伝わりにくいパケットの動きを直感的に理解できます。
          </p>
          <div className={styles.heroCta}>
            <Link href="/exercises" className={styles.btnPrimary}>
              演習をはじめる
            </Link>
            <Link href="/simulation" className={styles.btnSecondary}>
              自由に試す
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ② 特徴セクション */}
      <section className={styles.features}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>特徴</h2>
          <p className={styles.sectionSub}>直感的な操作で、ネットワークの仕組みが見えてくる</p>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureEmoji}>{f.emoji}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ③ 演習紹介セクション */}
      <section>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>演習で実力を試そう</h2>
          <p className={styles.sectionSub}>テーマ別の演習問題で、学んだ知識をすぐに実践できます</p>
          <div className={styles.exerciseCards}>
            {EXERCISE_LIST.map((card) => (
              <ExerciseCardItem key={card.id} card={card} />
            ))}
          </div>
          <Link href="/exercises" className={styles.allBtn}>
            すべての演習を見る →
          </Link>
        </div>
      </section>
    </div>
  );
}
