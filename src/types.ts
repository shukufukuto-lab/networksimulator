// =============================================================
// ネットワークシミュレータ 型定義
// 仕様書 v3.2 より生成
// =============================================================

// -------------------------------------------------------------
// Branded型
// -------------------------------------------------------------

type NodeId   = string & { readonly _brand: "NodeId" };
type LinkId   = string & { readonly _brand: "LinkId" };
type PortId   = string & { readonly _brand: "PortId" };
type VlanId   = number & { readonly _brand: "VlanId" };

// -------------------------------------------------------------
// ネットワーク基本型
// -------------------------------------------------------------

type IpAddress  = string & { readonly _brand: "IpAddress" };
type SubnetMask = string & { readonly _brand: "SubnetMask" };
type DomainName = string & { readonly _brand: "DomainName" };
type UrlString  = string & { readonly _brand: "UrlString" };

// -------------------------------------------------------------
// ノード種別
// -------------------------------------------------------------

type NodeType = "router" | "switch" | "pc" | "server" | "dns-server";

// -------------------------------------------------------------
// ポート定義
// 仕様「1ポートに1リンクのみ。nullは空き状態」
// -------------------------------------------------------------

type Port = {
  readonly id: PortId;
  /** "GigabitEthernet0/0" / "eth0" など */
  readonly name: string;
  linkedLinkId: LinkId | null;
};

// -------------------------------------------------------------
// Router設定型
// -------------------------------------------------------------

type RouterInterface = {
  readonly portName: string;
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  shutdown: boolean;
};

type StaticRoute = {
  readonly destination: IpAddress;
  readonly mask: SubnetMask;
  readonly nextHop: IpAddress;
};

// -------------------------------------------------------------
// Switch設定型
// -------------------------------------------------------------

type Vlan = {
  readonly id: VlanId;
  name: string;
};

// -------------------------------------------------------------
// DNSサーバ設定型
// -------------------------------------------------------------

type DnsARecord = {
  readonly recordType: "A";
  readonly domain: DomainName;
  ipAddress: IpAddress;
};

// -------------------------------------------------------------
// ノード定義
// -------------------------------------------------------------

type NodeBase = {
  readonly id: NodeId;
  readonly type: NodeType;
  name: string;
  position: { x: number; y: number };
  ports: Port[];
};

type Router = NodeBase & {
  readonly type: "router";
  interfaces: RouterInterface[];
  staticRoutes: StaticRoute[];
  configText: string;
};

type Switch = NodeBase & {
  readonly type: "switch";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  vlans: Vlan[];
  configText: string;
};

type PC = NodeBase & {
  readonly type: "pc";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  dnsServer: IpAddress | null;
};

type Server = NodeBase & {
  readonly type: "server";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  dnsServer: IpAddress | null;
  hostedDomains: DomainName[];
};

type DnsServer = NodeBase & {
  readonly type: "dns-server";
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  defaultGateway: IpAddress | null;
  aRecords: DnsARecord[];
};

type NetworkNode = Router | Switch | PC | Server | DnsServer;

// -------------------------------------------------------------
// リンク定義
// -------------------------------------------------------------

type Link = {
  readonly id: LinkId;
  readonly nodeA: NodeId;
  readonly portA: PortId;
  readonly nodeB: NodeId;
  readonly portB: PortId;
};

// -------------------------------------------------------------
// リンク作成UI状態（2ステップフロー）
// -------------------------------------------------------------

type LinkCreationState =
  | { step: "idle" }
  | {
      step: "source-selected";
      sourceNodeId: NodeId;
      sourcePortId: PortId;
      currentPosition: { x: number; y: number };
    }
  | {
      step: "target-node-selected";
      sourceNodeId: NodeId;
      sourcePortId: PortId;
      targetNodeId: NodeId;
      availablePorts: Port[];
    };

// -------------------------------------------------------------
// Ping通信
// -------------------------------------------------------------

type PingRequest = {
  readonly source: NodeId;
  readonly destination: string;
};

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
  readonly message: string;
};

// -------------------------------------------------------------
// Web通信
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
  readonly message: string;
  readonly hops: NodeId[];
};

// -------------------------------------------------------------
// シミュレーション
// -------------------------------------------------------------

type SimulationStatus = "idle" | "running" | "paused" | "finished";
type CommunicationType = "ping" | "web" | "dns";
type SimulationMode = "on" | "off";

type SimulationStep = {
  readonly from: NodeId;
  readonly to: NodeId;
  readonly link: LinkId;
  readonly communicationType: CommunicationType;
  readonly description: string;
  readonly direction: "outbound" | "return";
};

type SimulationState = {
  status: SimulationStatus;
  currentRequest: PingRequest | WebRequest | null;
  readonly steps: SimulationStep[];
  currentStepIndex: number;
};

// -------------------------------------------------------------
// GUI操作状態
// -------------------------------------------------------------

type PaletteItem = {
  readonly nodeType: NodeType;
  readonly label: string;
  readonly iconName: string;
};

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
    };

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
// -------------------------------------------------------------

type TopologyJson = {
  readonly version: "1.0";
  readonly savedAt: string;
  nodes: NetworkNode[];
  links: Link[];
};

// -------------------------------------------------------------
// 演習モード
// -------------------------------------------------------------

/** 演習の難度 */
type ExerciseDifficulty = "初級" | "中級" | "上級";

/**
 * 演習一覧カードの定義
 * 仕様「難度・タイトル・演習内容の3要素をカードに表示」
 */
type ExerciseCard = {
  readonly id: number;
  readonly difficulty: ExerciseDifficulty;
  readonly title: string;
  readonly description: string;
  /** 遷移先パス（例: "/exercises/1"） */
  readonly path: string;
};

/**
 * 演習画面でのノード制限設定
 * 演習ごとに「追加可能なノード種別」「追加上限数」「固定ノード」を定義する
 */
type ExerciseNodeRestriction = {
  /** パレットに表示するノード種別（空配列の場合はパレット非表示） */
  readonly allowedNodeTypes: NodeType[];
  /** 種別ごとの追加上限数（未定義の場合は無制限） */
  readonly maxCount: Partial<Record<NodeType, number>>;
  /** 移動・削除が禁止されているノードのID一覧 */
  readonly fixedNodeIds: NodeId[];
  /** IPアドレス編集が禁止されているノードのID一覧 */
  readonly lockedIpNodeIds: NodeId[];
};

/**
 * 演習の正解判定結果
 */
type JudgeResult =
  | { status: "clear" }
  | { status: "failure"; reasons: string[] };

/**
 * 演習画面全体の状態
 */
type ExerciseState = {
  readonly exerciseId: number;
  topology: {
    nodes: Map<NodeId, NetworkNode>;
    links: Map<LinkId, Link>;
  };
  simulation: SimulationState;
  drag: DragState;
  linkCreation: LinkCreationState;
  contextMenu: ContextMenu;
  selectedNodeId: NodeId | null;
  readonly restriction: ExerciseNodeRestriction;
  /** 判定結果（null: 未判定 / clear: クリア / failure: 失敗） */
  judgeResult: JudgeResult | null;
};

// -------------------------------------------------------------
// シミュレーションモード（自由モード）全体の状態
// -------------------------------------------------------------

type AppState = {
  topology: {
    nodes: Map<NodeId, NetworkNode>;
    links: Map<LinkId, Link>;
  };
  simulation: SimulationState;
  drag: DragState;
  linkCreation: LinkCreationState;
  contextMenu: ContextMenu;
  selectedNodeId: NodeId | null;
  selectedLinkId: LinkId | null;
  simulationMode: SimulationMode;
  readonly palette: PaletteItem[];
};
