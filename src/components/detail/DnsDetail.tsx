"use client";

import { useState } from "react";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Detail.module.css";

interface Props {
  node: DnsServer;
  dispatch: React.Dispatch<Action>;
}

export default function DnsDetail({ node, dispatch }: Props) {
  const [newDomain, setNewDomain] = useState("");
  const [newIp, setNewIp] = useState("");

  const updateNode = (patch: Partial<DnsServer>) => {
    dispatch({ type: "UPDATE_NODE", payload: { node: { ...node, ...patch } } });
  };

  const addRecord = () => {
    const d = newDomain.trim();
    const ip = newIp.trim();
    if (!d || !ip) return;
    if (node.aRecords.some((r) => r.domain === d)) return; // 重複禁止
    const record: DnsARecord = {
      recordType: "A",
      domain: d as DomainName,
      ipAddress: ip as IpAddress,
    };
    updateNode({ aRecords: [...node.aRecords, record] });
    setNewDomain("");
    setNewIp("");
  };

  const removeRecord = (domain: DomainName) => {
    updateNode({ aRecords: node.aRecords.filter((r) => r.domain !== domain) });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>DNS: {node.name}</div>

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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>ネットワーク設定</div>
        <div className={styles.field}>
          <label className={styles.label}>IPアドレス</label>
          <input
            className={styles.input}
            type="text"
            placeholder="192.168.1.53"
            value={node.ipAddress ?? ""}
            onChange={(e) =>
              updateNode({ ipAddress: e.target.value as IpAddress || null })
            }
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>サブネットマスク</label>
          <input
            className={styles.input}
            type="text"
            placeholder="255.255.255.0"
            value={node.subnetMask ?? ""}
            onChange={(e) =>
              updateNode({ subnetMask: e.target.value as SubnetMask || null })
            }
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>デフォルトGW</label>
          <input
            className={styles.input}
            type="text"
            placeholder="192.168.1.1"
            value={node.defaultGateway ?? ""}
            onChange={(e) =>
              updateNode({ defaultGateway: e.target.value as IpAddress || null })
            }
          />
        </div>
      </div>

      {/* Aレコード */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Aレコード</div>
        {node.aRecords.map((rec) => (
          <div key={rec.domain} className={styles.recordItem}>
            <span className={styles.recordText}>
              {rec.domain} → {rec.ipAddress}
            </span>
            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => removeRecord(rec.domain)}
            >
              削除
            </button>
          </div>
        ))}
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            type="text"
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <input
            className={styles.addInput}
            type="text"
            placeholder="10.0.0.2"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
          />
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={addRecord}
        >
          Aレコード追加
        </button>
      </div>
    </div>
  );
}
