"use client";

import { useState } from "react";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Detail.module.css";

interface Props {
  node: Server;
  dispatch: React.Dispatch<Action>;
}

export default function ServerDetail({ node, dispatch }: Props) {
  const [newDomain, setNewDomain] = useState("");

  const updateNode = (patch: Partial<Server>) => {
    dispatch({ type: "UPDATE_NODE", payload: { node: { ...node, ...patch } } });
  };

  const addDomain = () => {
    const d = newDomain.trim();
    if (!d || (node.hostedDomains as string[]).includes(d)) return;
    updateNode({ hostedDomains: [...node.hostedDomains, d as DomainName] });
    setNewDomain("");
  };

  const removeDomain = (domain: DomainName) => {
    updateNode({
      hostedDomains: node.hostedDomains.filter((d) => d !== domain),
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Server: {node.name}</div>

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
            placeholder="10.0.0.2"
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
            placeholder="10.0.0.1"
            value={node.defaultGateway ?? ""}
            onChange={(e) =>
              updateNode({ defaultGateway: e.target.value as IpAddress || null })
            }
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>DNSサーバ</label>
          <input
            className={styles.input}
            type="text"
            placeholder="192.168.1.53"
            value={node.dnsServer ?? ""}
            onChange={(e) =>
              updateNode({ dnsServer: e.target.value as IpAddress || null })
            }
          />
        </div>
      </div>

      {/* ホストドメイン */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>ホストドメイン</div>
        {node.hostedDomains.map((domain) => (
          <div key={domain} className={styles.recordItem}>
            <span className={styles.recordText}>{domain}</span>
            <button
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => removeDomain(domain)}
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
            onKeyDown={(e) => e.key === "Enter" && addDomain()}
          />
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={addDomain}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
