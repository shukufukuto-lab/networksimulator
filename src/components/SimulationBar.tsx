"use client";

import type { Action } from "@/components/SimulatorApp";
import styles from "./SimulationBar.module.css";

interface Props {
  simulation: SimulationState;
  simulationMode: SimulationMode;
  dispatch: React.Dispatch<Action>;
}

const STATUS_LABEL: Record<SimulationStatus, string> = {
  idle: "待機中",
  running: "実行中",
  paused: "一時停止",
  finished: "完了",
};

export default function SimulationBar({ simulation, simulationMode, dispatch }: Props) {
  const { status, steps, currentStepIndex } = simulation;

  const currentStep =
    status !== "idle" && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

  return (
    <div className={styles.bar}>
      <div className={styles.status}>
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {currentStep && (
          <span className={styles.stepDesc}>{currentStep.description}</span>
        )}
        {status === "finished" && steps.length > 0 && (
          <span className={styles.stepDesc}>
            全{steps.length}ホップ完了
          </span>
        )}
        {status === "finished" && steps.length === 0 && (
          <span className={styles.stepDesc}>経路なし</span>
        )}
      </div>
      <div className={styles.controls}>
        {simulationMode === "on" && status === "paused" && (
          <button
            className={`${styles.btn} ${styles.next}`}
            onClick={() => dispatch({ type: "NEXT_STEP" })}
          >
            次へ
          </button>
        )}
        {status !== "idle" && (
          <button
            className={`${styles.btn} ${styles.reset}`}
            onClick={() => dispatch({ type: "RESET_SIMULATION" })}
          >
            リセット
          </button>
        )}
        {status === "idle" && (
          <span className={styles.hint}>
            ノードの設定パネルからPingまたはWebアクセスを送信してください
          </span>
        )}
      </div>
    </div>
  );
}
