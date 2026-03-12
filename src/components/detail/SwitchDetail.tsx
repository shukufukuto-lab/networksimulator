"use client";

import { useState } from "react";
import { parseSwitchConfig } from "@/domain/config-parser";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Detail.module.css";

interface Props {
  node: Switch;
  dispatch: React.Dispatch<Action>;
}

export default function SwitchDetail({ node, dispatch }: Props) {
  const [configText, setConfigText] = useState(node.configText);

  const handleApplyConfig = () => {
    const parsed = parseSwitchConfig(configText);
    const updated: Switch = {
      ...node,
      ipAddress: parsed.ipAddress,
      subnetMask: parsed.subnetMask,
      vlans: parsed.vlans,
      configText,
    };
    dispatch({ type: "UPDATE_NODE", payload: { node: updated } });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Switch: {node.name}</div>

      {/* ポート一覧 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>ポート</div>
        {node.ports.map((port) => (
          <div key={port.id} className={styles.ifaceItem}>
            <span className={styles.ifaceName}>{port.name}</span>
            <span className={styles.ifaceIp}>
              {port.linkedLinkId ? "使用中" : "空き"}
            </span>
          </div>
        ))}
      </div>

      {/* IP情報 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>管理IP</div>
        <div className={styles.ifaceItem}>
          <span className={styles.ifaceIp}>
            {node.ipAddress
              ? `${node.ipAddress} / ${node.subnetMask}`
              : "未設定"}
          </span>
        </div>
      </div>

      {/* VLAN一覧 */}
      {node.vlans.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>VLAN</div>
          {node.vlans.map((vlan) => (
            <div key={vlan.id} className={styles.vlanItem}>
              VLAN {vlan.id}{vlan.name ? ` – ${vlan.name}` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Ciscoコンフィグ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Cisco コンフィグ</div>
        <textarea
          className={styles.textarea}
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          placeholder={"interface vlan 10\n  ip address 192.168.10.1 255.255.255.0\nvlan 10\n  name SALES"}
          rows={6}
        />
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleApplyConfig}
        >
          適用
        </button>
      </div>
    </div>
  );
}
