"use client";

import { useState } from "react";
import { computePing } from "@/domain/routing";
import { computeWeb } from "@/domain/routing";
import type { Action } from "@/components/SimulatorApp";
import BrowserModal from "@/components/modals/BrowserModal";
import styles from "./Detail.module.css";

interface Props {
  node: PC;
  nodes: Map<NodeId, NetworkNode>;
  links: Map<LinkId, Link>;
  dispatch: React.Dispatch<Action>;
}

export default function PcDetail({ node, nodes, links, dispatch }: Props) {
  const [pingDest, setPingDest] = useState("");
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [webUrl, setWebUrl] = useState("");
  const [webResult, setWebResult] = useState<WebResult | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  const updateNode = (patch: Partial<PC>) => {
    dispatch({ type: "UPDATE_NODE", payload: { node: { ...node, ...patch } } });
  };

  const handlePing = () => {
    if (!pingDest.trim()) return;
    const req: PingRequest = {
      source: node.id,
      destination: pingDest.trim(),
    };
    const result = computePing(nodes, links, req);
    setPingResult(result);
    dispatch({ type: "START_SIMULATION", payload: req });
  };

  const handleWeb = () => {
    if (!webUrl.trim()) return;
    const url = webUrl.trim().startsWith("http")
      ? webUrl.trim()
      : `http://${webUrl.trim()}`;
    const req: WebRequest = {
      sourceNodeId: node.id,
      url: url as UrlString,
    };
    const result = computeWeb(nodes, links, req);
    setWebResult(result);
    dispatch({ type: "START_SIMULATION", payload: req });
    setShowBrowser(true);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>PC: {node.name}</div>

      {/* ネットワーク設定 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>ネットワーク設定</div>
        <div className={styles.field}>
          <label className={styles.label}>IPアドレス</label>
          <input
            className={styles.input}
            type="text"
            placeholder="192.168.1.2"
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

      {/* Ping */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Ping</div>
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            type="text"
            placeholder="宛先IP またはホスト名"
            value={pingDest}
            onChange={(e) => setPingDest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePing()}
          />
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handlePing}
          >
            送信
          </button>
        </div>
        {pingResult && (
          <div
            className={`${styles.pingResult} ${pingResult.success ? styles.pingSuccess : styles.pingFail}`}
          >
            {pingResult.message}
          </div>
        )}
      </div>

      {/* Webアクセス */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Webアクセス</div>
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            type="text"
            placeholder="http://example.com"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWeb()}
          />
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleWeb}
          >
            接続
          </button>
        </div>
      </div>

      {/* ブラウザモーダル */}
      {showBrowser && webResult && (
        <BrowserModal
          result={webResult}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
