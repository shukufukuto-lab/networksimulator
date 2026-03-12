"use client";

import { useState } from "react";
import { parseRouterConfig } from "@/domain/config-parser";
import { computePing } from "@/domain/routing";
import type { Action } from "@/components/SimulatorApp";
import styles from "./Detail.module.css";

interface Props {
  node: Router;
  nodes: Map<NodeId, NetworkNode>;
  links: Map<LinkId, Link>;
  dispatch: React.Dispatch<Action>;
}

export default function RouterDetail({ node, nodes, links, dispatch }: Props) {
  const [pingDest, setPingDest] = useState("");
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [configText, setConfigText] = useState(node.configText);

  const handleApplyConfig = () => {
    const parsed = parseRouterConfig(configText, node.interfaces);
    const updated: Router = {
      ...node,
      interfaces: parsed.interfaces,
      staticRoutes: parsed.staticRoutes,
      configText,
    };
    dispatch({ type: "UPDATE_NODE", payload: { node: updated } });
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

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>Router: {node.name}</div>

      {/* インターフェース一覧 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>インターフェース</div>
        {node.interfaces.map((iface) => (
          <div key={iface.portName} className={styles.ifaceItem}>
            <span className={styles.ifaceName}>{iface.portName}</span>
            <span className={styles.ifaceIp}>
              {iface.ipAddress
                ? `${iface.ipAddress} / ${iface.subnetMask}`
                : "未設定"}
              {iface.shutdown ? " [down]" : " [up]"}
            </span>
          </div>
        ))}
      </div>

      {/* スタティックルート一覧 */}
      {node.staticRoutes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>スタティックルート</div>
          {node.staticRoutes.map((r, i) => (
            <div key={i} className={styles.routeItem}>
              {r.destination}/{r.mask} via {r.nextHop}
            </div>
          ))}
        </div>
      )}

      {/* Ciscoコンフィグ入力 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Cisco コンフィグ</div>
        <textarea
          className={styles.textarea}
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          placeholder={"interface GigabitEthernet0/0\n  ip address 192.168.1.1 255.255.255.0\n  no shutdown\nip route 0.0.0.0 0.0.0.0 192.168.1.254"}
          rows={6}
        />
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleApplyConfig}
        >
          適用
        </button>
      </div>

      {/* Ping */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Ping</div>
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            type="text"
            placeholder="宛先IP"
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
    </div>
  );
}
