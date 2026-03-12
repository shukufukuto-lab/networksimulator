// =============================================================
// ネットワークシミュレータ 型定義
// 仕様書 v3.0（確定版）より生成
// =============================================================

// -------------------------------------------------------------
// Branded型：IDの混同をコンパイル時に防ぐ
// -------------------------------------------------------------

/** ノードを一意に識別するID */
type NodeId = string & { readonly _brand: "NodeId" };

/** リンクを一意に識別するID */
type LinkId = string & { readonly _brand: "LinkId" };

/** VLANを識別するID（1〜4094） */
type VlanId = number & { readonly _brand: "VlanId" };

// -------------------------------------------------------------
// ネットワーク基本型
// -------------------------------------------------------------

/** IPアドレス文字列（例: "192.168.1.1"） */
type IpAddress = string & { readonly _brand: "IpAddress" };

/** サブネットマスク文字列（例: "255.255.255.0"） */
type SubnetMask = string & { readonly _brand: "SubnetMask" };

/** ドメイン名（例: "example.com"） */
type DomainName = string & { readonly _brand: "DomainName" };

/** URL文字列（例: "http://example.com/index.html"） */
type UrlString = string & { readonly _brand: "UrlString" };

// -------------------------------------------------------------
// ノード種別
// 仕様「Router / Switch / PC / Server / DNSサーバ の5種類」
// -------------------------------------------------------------

type NodeType = "router" | "switch" | "pc" | "server" | "dns-server";

// -------------------------------------------------------------
// Router設定型
// -------------------------------------------------------------

/**
 * ルータの論理インターフェース
 * 仕様「GigabitEthernet0/0から自動採番・ユーザー入力不要」
 * 仕様「物理パーツの装脱着は行わない（論理IFのみ）」
 */
type RouterInterface = {
  /** 論理IF名（例: "GigabitEthernet0/0"）自動採番のためreadonly */
  readonly name: string;
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  shutdown: boolean;
};

/**
 * スタティックルーティングエントリ
 * 仕様「Ciscoコンフィグの ip route コマンドで設定」
 */
type StaticRoute = {
  readonly destination: IpAddress;
  readonly mask: SubnetMask;
  readonly nextHop: IpAddress;
};

// -------------------------------------------------------------
// Switch設定型
// -------------------------------------------------------------

/**
 * VLANエントリ
 * 仕様「Ciscoコンフィグの vlan コマンドで設定」
 */
type Vlan = {
  readonly id: VlanId;
  name: string;
};

// -------------------------------------------------------------
// DNSサーバ設定型
// -------------------------------------------------------------

/**
 * DNS Aレコード
 * 仕様「1ドメインにつき1レコードのみ（重複ドメイン禁止）」
 * 仕様「GUIから追加・削除が可能」
 */
type DnsARecord = {
  readonly recordType: "A";
  readonly domain: DomainName;
  ipAddress: IpAddress;
};

// -------------------------------------------------------------
// ノード定義
// -------------------------------------------------------------

/** 全ノード共通のベース */
type NodeBase = {
  readonly id: NodeId;
  readonly type: NodeType;
  /** 仕様「種別ごとに自動採番（Router1, Router2...）」 */
  name: string;
  /** キャンバス上の座標。ドラッグで変更される */
  position: { x: number; y: number };
};

/**
 * ルータ
 * 仕様「異なるネットワーク間の転送を行う」
 */
type Router = NodeBase & {
  readonly type: "router";
  /** 論理インターフェース一覧（自動採番） */
  interfaces: RouterInterface[];
  staticRoutes: StaticRoute[];
  /**
   * Ciscoコンフィグ入力テキスト（CLI直打ち）
   * 仕様「interface / ip address / ip route / no shutdown に対応」
   */
  configText: string;
};

/**
 * スイッチ
 * 仕様「同一ネットワーク内の転送を行う」
 */
type Switch = NodeBase & {
  readonly type: "switch";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  vlans: Vlan[];
  /**
   * Ciscoコンフィグ入力テキスト（CLI直打ち）
   * 仕様「interface / ip address / vlan / switchport に対応」
   */
  configText: string;
};

/**
 * PC端末
 * 仕様「Ping送信元・Webブラウザアクセス送信元になれる」
 */
type PC = NodeBase & {
  readonly type: "pc";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  dnsServer: IpAddress | null;
};

/**
 * サーバ
 * 仕様「Ping応答元・Webサーバとして応答できる」
 */
type Server = NodeBase & {
  readonly type: "server";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  dnsServer: IpAddress | null;
  /** このサーバが応答するドメイン名一覧 */
  hostedDomains: DomainName[];
};

/**
 * DNSサーバ
 * 仕様「Aレコードを管理し名前解決要求に応答する」
 */
type DnsServer = NodeBase & {
  readonly type: "dns-server";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  /** 仕様「1ドメインにつき1レコードのみ」 */
  aRecords: DnsARecord[];
};

/** 全ノードのUnion型 */
type NetworkNode = Router | Switch | PC | Server | DnsServer;

// -------------------------------------------------------------
// リンク定義
// 仕様「同じノード間に1本のみ（重複リンク禁止）」
// -------------------------------------------------------------

type Link = {
  readonly id: LinkId;
  readonly nodeA: NodeId;
  readonly nodeB: NodeId;
};

// -------------------------------------------------------------
// Ping通信
// 仕様「失敗メッセージはWindowsコマンドプロンプトのping表示に準拠」
// -------------------------------------------------------------

type PingRequest = {
  readonly source: NodeId;
  /** IP or ホスト名 */
  readonly destination: string;
};

/**
 * Ping失敗理由（Windows表示準拠）
 * REQUEST_TIMED_OUT            → "要求がタイムアウトしました。"
 * DESTINATION_HOST_UNREACHABLE → "宛先ホストに到達できません。"
 * TTL_EXPIRED_IN_TRANSIT       → "TTLが転送中に期限切れになりました。"
 * IP_NOT_CONFIGURED            → （シミュレータ独自）IPアドレス未設定
 * GENERAL_FAILURE              → "一般的な失敗です。"
 */
type PingFailReason =
  | "REQUEST_TIMED_OUT"
  | "DESTINATION_HOST_UNREACHABLE"
  | "TTL_EXPIRED_IN_TRANSIT"
  | "IP_NOT_CONFIGURED"
  | "GENERAL_FAILURE";

type PingResult = {
  readonly request: PingRequest;
  readonly success: boolean;
  readonly hops: NodeId[];
  readonly failReason: PingFailReason | null;
  /** Windowsコマンドプロンプト相当のメッセージ */
  readonly message: string;
};

// -------------------------------------------------------------
// Web通信
// 仕様「DNS名前解決 → HTTPアクセスの2段階」
// -------------------------------------------------------------

type WebRequest = {
  readonly sourceNodeId: NodeId;
  readonly url: UrlString;
};

type DnsResolutionResult =
  | { success: true;  resolvedIp: IpAddress }
  | { success: false; reason: "DNS_SERVER_UNREACHABLE" | "DOMAIN_NOT_FOUND" };

type HttpStatus = 200 | 404 | 503;

type WebResult = {
  readonly request: WebRequest;
  readonly dnsResult: DnsResolutionResult;
  readonly httpStatus: HttpStatus | null;
  readonly success: boolean;
  /** ブラウザ風UIに表示するメッセージ */
  readonly message: string;
  /** DNS問い合わせ＋HTTP通信の全ホップ経路 */
  readonly hops: NodeId[];
};

// -------------------------------------------------------------
// シミュレーション
// 仕様「スタート→ステップ実行（次へボタンで1ホップずつ進む）」
// -------------------------------------------------------------

/** 仕様「idle: 未開始 / running: 実行中 / paused: 次へ待ち / finished: 完了」 */
type SimulationStatus = "idle" | "running" | "paused" | "finished";

type CommunicationType = "ping" | "web" | "dns";

/** 1ホップ分の通信イベント */
type SimulationStep = {
  readonly from: NodeId;
  readonly to: NodeId;
  readonly link: LinkId;
  readonly communicationType: CommunicationType;
  /** GUI上のアニメーション・ログ表示用の説明 */
  readonly description: string;
};

type SimulationState = {
  status: SimulationStatus;
  currentRequest: PingRequest | WebRequest | null;
  readonly steps: SimulationStep[];
  /** 現在表示中のホップインデックス（0始まり） */
  currentStepIndex: number;
};

// -------------------------------------------------------------
// GUI操作状態
// -------------------------------------------------------------

/**
 * ノードパレットのアイテム
 * 仕様「左パレットに5種類を並べる」
 */
type PaletteItem = {
  readonly nodeType: NodeType;
  readonly label: string;
  readonly icon: string;
};

/**
 * ドラッグ操作の状態（4種類）
 * 仕様「パレットから配置 / ノード移動 / リンク作成（接続点ドラッグ）」
 */
type DragState =
  | { kind: "none" }
  | {
      kind: "from-palette";
      nodeType: NodeType;
      currentPosition: { x: number; y: number };
    }
  | {
      kind: "moving-node";
      nodeId: NodeId;
      offset: { x: number; y: number };
      currentPosition: { x: number; y: number };
    }
  | {
      kind: "creating-link";
      /** 仕様「ノードの端の接続点からドラッグ開始」 */
      sourceNodeId: NodeId;
      currentPosition: { x: number; y: number };
    };

/**
 * 右クリックコンテキストメニュー
 * 仕様「ノード右クリック→「設定」「削除」を表示」
 * 仕様「リンク右クリック→「削除」を表示」
 */
type ContextMenu =
  | { visible: false }
  | {
      visible: true;
      targetType: "node";
      targetId: NodeId;
      position: { x: number; y: number };
    }
  | {
      visible: true;
      targetType: "link";
      targetId: LinkId;
      position: { x: number; y: number };
    };

// -------------------------------------------------------------
// トポロジ保存・読み込み
// 仕様「JSONファイルとしてダウンロード・復元が可能」
// -------------------------------------------------------------

/**
 * JSONファイルとして保存・読み込みする対象
 * 仕様「ノード一覧・リンク一覧・設定値・座標を保存」
 */
type TopologyJson = {
  /** フォーマットバージョン（将来の互換性管理用） */
  readonly version: "1.0";
  readonly savedAt: string;
  nodes: NetworkNode[];
  links: Link[];
};

// -------------------------------------------------------------
// アプリケーション全体の状態
// -------------------------------------------------------------

type AppState = {
  topology: {
    nodes: Map<NodeId, NetworkNode>;
    links: Map<LinkId, Link>;
  };
  simulation: SimulationState;
  drag: DragState;
  contextMenu: ContextMenu;
  /** 右パネルに表示中のノードID（nullなら非表示） */
  selectedNodeId: NodeId | null;
  /** 固定値 */
  readonly palette: PaletteItem[];
};
