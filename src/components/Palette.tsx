"use client";

import type { Action } from "@/components/SimulatorApp";
import styles from "./Palette.module.css";

// iconName → 表示ラベルのフォールバックマッピング
const ICON_LABELS: Record<string, string> = {
  MdRouter: "RTR",
  MdDeviceHub: "SW",
  MdComputer: "PC",
  MdStorage: "SRV",
  MdPublic: "DNS",
};

interface Props {
  items: PaletteItem[];
  dispatch: React.Dispatch<Action>;
}

export default function Palette({ items }: Props) {
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: NodeType
  ) => {
    e.dataTransfer.setData("nodeType", nodeType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className={styles.palette}>
      <div className={styles.title}>ノード</div>
      {items.map((item) => (
        <div
          key={item.nodeType}
          className={`${styles.item} ${styles[item.nodeType]}`}
          draggable
          onDragStart={(e) => handleDragStart(e, item.nodeType)}
          title={`${item.label}をキャンバスにドラッグ`}
        >
          <span className={styles.icon}>{ICON_LABELS[item.iconName] ?? item.iconName}</span>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
      <div className={styles.hint}>↑ ドラッグして配置</div>
    </aside>
  );
}
