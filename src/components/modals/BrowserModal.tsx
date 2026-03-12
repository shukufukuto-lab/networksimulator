"use client";

import styles from "./BrowserModal.module.css";

interface Props {
  result: WebResult;
  onClose: () => void;
}

const STATUS_TEXT: Record<number, string> = {
  200: "200 OK",
  404: "404 Not Found",
  503: "503 Service Unavailable",
};

export default function BrowserModal({ result, onClose }: Props) {
  const { request, dnsResult, httpStatus, success, message } = result;

  const statusText = httpStatus ? STATUS_TEXT[httpStatus] : null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.browser} onClick={(e) => e.stopPropagation()}>
        {/* ブラウザ風ヘッダー */}
        <div className={styles.titleBar}>
          <span className={styles.titleText}>ブラウザ</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* アドレスバー */}
        <div className={styles.addressBar}>
          <span className={styles.protocol}>
            {success ? "http" : "err"}://
          </span>
          <span className={styles.url}>{request.url}</span>
        </div>

        {/* ステータス */}
        {statusText && (
          <div
            className={`${styles.statusLine} ${success ? styles.ok : styles.err}`}
          >
            {statusText}
          </div>
        )}

        {/* コンテンツエリア */}
        <div className={styles.content}>
          {success ? (
            <div className={styles.page}>
              <h2 className={styles.pageTitle}>{request.url}</h2>
              <p className={styles.pageBody}>接続成功</p>
              {dnsResult.success && (
                <p className={styles.meta}>
                  DNS解決: {dnsResult.resolvedIp}
                </p>
              )}
            </div>
          ) : (
            <div className={styles.errorPage}>
              <div className={styles.errorCode}>{statusText ?? "エラー"}</div>
              <div className={styles.errorMsg}>{message}</div>
              {dnsResult.success ? (
                <p className={styles.meta}>
                  DNS解決: {dnsResult.resolvedIp}
                </p>
              ) : (
                <p className={styles.meta}>
                  DNS失敗:{" "}
                  {dnsResult.reason === "DNS_SERVER_UNREACHABLE"
                    ? "DNSサーバに到達できません"
                    : "ドメインが見つかりません"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
