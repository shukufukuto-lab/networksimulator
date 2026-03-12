"use client";

import type { Action } from "@/components/SimulatorApp";
import styles from "./ContextMenu.module.css";

interface Props {
  contextMenu: Extract<ContextMenu, { visible: true }>;
  dispatch: React.Dispatch<Action>;
}

export default function ContextMenu({ contextMenu, dispatch }: Props) {
  const { position, targetType, targetId } = contextMenu;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetType === "node") {
      dispatch({ type: "DELETE_NODE", payload: { nodeId: targetId as NodeId } });
    } else {
      dispatch({ type: "DELETE_LINK", payload: { linkId: targetId as LinkId } });
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (targetType === "node") {
      dispatch({ type: "SELECT_NODE", payload: { nodeId: targetId as NodeId } });
    }
    dispatch({ type: "HIDE_CONTEXT_MENU" });
  };

  return (
    <ul
      className={styles.menu}
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {targetType === "node" && (
        <li className={styles.item} onClick={handleSettings}>
          設定
        </li>
      )}
      <li className={`${styles.item} ${styles.danger}`} onClick={handleDelete}>
        削除
      </li>
    </ul>
  );
}
