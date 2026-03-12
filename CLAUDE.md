# Claude Codeへの実装指示書 v3.2

## このプロジェクトについて

ネットワークシミュレータのWebアプリです。
必ず以下を読んでから実装してください。

- 仕様書: `docs/spec.md`
- 型定義: `src/types.ts` ← **変更禁止。実装はこの型に従うこと**

---

## 技術スタック

- Next.js 15 + TypeScript + App Router
- スタイリング: CSS Modules（`*.module.css`）
- 状態管理: useReducer（外部状態管理ライブラリは使わない）
- アイコン: react-icons（`npm install react-icons`）

---

## プロジェクト作成コマンド

```bash
npx create-next-app@latest network-simulator \
  --typescript --app --no-tailwind --src-dir --import-alias "@/*"
cd network-simulator
npm install react-icons
```

---

## ファイル構成（この通りに作成すること）

```
src/
├── types.ts                              # 作成済み・変更禁止
│
├── app/
│   ├── layout.tsx                        # ルートレイアウト
│   ├── page.tsx                          # トップ画面
│   ├── simulation/
│   │   └── page.tsx                      # シミュレーションモード
│   └── exercises/
│       ├── page.tsx                      # 演習一覧画面
│       ├── 1/
│       │   └── page.tsx                  # 演習1: VLAN制御
│       └── 2/
│           └── page.tsx                  # 演習2: ルーティング設定
│
├── domain/                               # ビジネスロジック（"use client"不要）
│   ├── topology.ts                       # ノード・リンク・ポートの操作
│   ├── routing.ts                        # 経路探索・Ping疎通判定・DNS解決
│   ├── simulation.ts                     # ステップ実行・通信イベント生成
│   ├── config-parser.ts                  # CiscoコンフィグCLIのパース
│   └── exercises/
│       ├── exercise1-judge.ts            # 演習1の正解判定ロジック
│       └── exercise2-judge.ts            # 演習2の正解判定ロジック
│
├── components/
│   ├── simulator/                        # シミュレーションモード用（"use client"）
│   │   ├── SimulatorApp.tsx              # ルートコンポーネント・useReducer管理
│   │   ├── Palette.tsx                   # 左パネル：ノードパレット
│   │   ├── Canvas.tsx                    # キャンバス（SVG描画）
│   │   ├── NodeItem.tsx                  # 各ノード（アイコン・ポート）
│   │   ├── LinkItem.tsx                  # 各リンク
│   │   ├── PortSelector.tsx              # ポート選択ドロップダウン
│   │   ├── ContextMenu.tsx               # 右クリックメニュー
│   │   ├── SimulationBar.tsx             # 下部操作バー＋ログ
│   │   └── PacketAnimation.tsx           # パケットアニメーション
│   │
│   ├── exercise/                         # 演習モード用（"use client"）
│   │   ├── ExerciseApp.tsx               # 演習画面ルートコンポーネント
│   │   ├── ExerciseCanvas.tsx            # 演習用キャンバス（制限付き）
│   │   ├── ExercisePalette.tsx           # 演習用パレット（制限付き）
│   │   ├── ExerciseBar.tsx               # 下部操作バー＋Answerボタン
│   │   ├── JudgeOverlay.tsx              # クリア/失敗のオーバーレイ表示
│   │   └── ExerciseCard.tsx              # 演習一覧のカードコンポーネント
│   │
│   └── shared/                           # 共通コンポーネント（"use client"）
│       ├── NodeDetail/
│       │   ├── RouterDetail.tsx
│       │   ├── SwitchDetail.tsx
│       │   ├── PcDetail.tsx
│       │   ├── ServerDetail.tsx
│       │   └── DnsDetail.tsx
│       └── modals/
│           ├── BrowserModal.tsx
│           └── ConfirmDialog.tsx
│
└── utils/
    ├── id-generator.ts
    ├── node-factory.ts
    └── topology-io.ts
```

---

## Next.js固有のルール

### "use client" の付け方
```
"use client" が必要               "use client" 不要
─────────────────────────────────────────────────
components/ 配下のすべて          domain/ 配下のすべて
utils/topology-io.ts              utils/id-generator.ts
                                  utils/node-factory.ts
                                  types.ts
```

### app/page.tsx（トップ画面）
```tsx
// サーバーコンポーネント
import Link from "next/link";
export default function TopPage() {
  return (
    <main>
      <h1>ネットワークシミュレータ</h1>
      <Link href="/simulation">シミュレーションモードへ</Link>
      <Link href="/exercises">演習モードへ</Link>
    </main>
  );
}
```

### app/simulation/page.tsx
```tsx
import SimulatorApp from "@/components/simulator/SimulatorApp";
export default function SimulationPage() {
  return <SimulatorApp />;
}
```

### app/exercises/page.tsx
```tsx
import ExerciseCard from "@/components/exercise/ExerciseCard";
import { EXERCISE_LIST } from "@/domain/exercises/exercise-list";
export default function ExercisesPage() {
  // グリッドにExerciseCardを並べる
}
```

### app/exercises/1/page.tsx と 2/page.tsx
```tsx
import ExerciseApp from "@/components/exercise/ExerciseApp";
export default function Exercise1Page() {
  return <ExerciseApp exerciseId={1} />;
}
```

---

## 実装の進め方

### Phase 1: ユーティリティ＋ドメインロジック
1. `utils/id-generator.ts`
2. `utils/node-factory.ts`
3. `domain/topology.ts`
4. `domain/routing.ts`
5. `domain/config-parser.ts`
6. `domain/simulation.ts`

→ 各ファイル完了後に `npx tsc --noEmit` でエラーがないこと確認

### Phase 2: シミュレーションモードUI
7. `components/simulator/SimulatorApp.tsx`
8. `components/simulator/Palette.tsx`
9. `components/simulator/Canvas.tsx`
10. `components/simulator/NodeItem.tsx`
11. `components/simulator/LinkItem.tsx`
12. `components/simulator/PortSelector.tsx`
13. `components/simulator/ContextMenu.tsx`
14. `components/shared/NodeDetail/`（5ファイル）

### Phase 3: シミュレーション機能
15. `components/simulator/PacketAnimation.tsx`
16. `components/simulator/SimulationBar.tsx`
17. `components/shared/modals/`（2ファイル）
18. `utils/topology-io.ts`

### Phase 4: 演習モード
19. `domain/exercises/exercise1-judge.ts`
20. `domain/exercises/exercise2-judge.ts`
21. `components/exercise/ExerciseCard.tsx`
22. `components/exercise/ExerciseApp.tsx`
23. `components/exercise/ExerciseCanvas.tsx`
24. `components/exercise/ExercisePalette.tsx`
25. `components/exercise/ExerciseBar.tsx`
26. `components/exercise/JudgeOverlay.tsx`

### Phase 5: ページ組み立て
27. `app/page.tsx`（トップ画面）
28. `app/simulation/page.tsx`
29. `app/exercises/page.tsx`
30. `app/exercises/1/page.tsx`
31. `app/exercises/2/page.tsx`

---

## 実装ルール

### 型について
- `src/types.ts` の型をそのまま使うこと
- `any` は使用禁止
- Branded型のキャストは最小限の箇所のみ許可

### アイコン（react-icons）
```tsx
import { MdRouter, MdDeviceHub, MdComputer, MdStorage, MdPublic } from "react-icons/md";

const ICON_MAP: Record<NodeType, React.ComponentType<{ size?: number }>> = {
  "router":     MdRouter,
  "switch":     MdDeviceHub,
  "pc":         MdComputer,
  "server":     MdStorage,
  "dns-server": MdPublic,
};
```
SVGキャンバス上では `<foreignObject>` でアイコンを埋め込むこと。

### ノード・ポート自動生成（node-factory.ts）
```typescript
// ポート名の生成ルール
Router / Switch : ["GigabitEthernet0/0" 〜 "GigabitEthernet0/7"]
PC             : ["eth0"]
Server / DNS   : ["eth0" 〜 "eth7"]

// ノード名の採番ルール
Router → Router1, Router2...  Switch → Switch1...
PC → PC1...  Server → Server1...  DNSサーバ → DNS1...
```

### リンク作成フロー（LinkCreationState）
1. ポートクリック → `step: "source-selected"`
2. 接続先ノードクリック → `step: "target-node-selected"`（空きポート一覧表示）
3. ポート選択 → リンク作成・`step: "idle"`
4. ESC / 背景クリック → `step: "idle"`（キャンセル）

### パケットアニメーション（PacketAnimation.tsx）
- SVG上でパケット（円）がリンクの始点→終点へ移動
- CSSアニメーション・duration 600ms
- アクティブリンクは stroke-color と stroke-width を変更
- アニメーション完了後に自動で paused 状態へ戻る

### 演習モード固有のルール

**演習データ定義（domain/exercises/exercise-list.ts）**
```typescript
// ExerciseCard型の配列として定義する
export const EXERCISE_LIST: ExerciseCard[] = [
  {
    id: 1,
    difficulty: "初級",
    title: "VLAN制御",
    description: "4つのPCを一つのスイッチで2組のネットワークに分離する",
    path: "/exercises/1",
  },
  {
    id: 2,
    difficulty: "初級",
    title: "ルーティング設定",
    description: "別セグメントの2台のPCをルーターで繋いで疎通を取る",
    path: "/exercises/2",
  },
];
```

**ExerciseApp.tsx の役割**
- exerciseId を受け取り、対応する初期トポロジと ExerciseNodeRestriction を生成する
- ExerciseState を useReducer で管理する
- ExerciseCanvas・ExercisePalette・ExerciseBar に渡す

**演習1の初期トポロジ生成**
```
PC1（左上）・PC2（右上）・PC3（左下）・PC4（右下）・Switch1（中央）
全ノードのfixedNodeIds に登録する（移動・削除不可）
allowedNodeTypes: []（パレット非表示）
```

**演習2の初期トポロジ生成**
```
PC1（左側・IP: 192.168.1.1/255.255.255.0 設定済み）
PC2（右側・IP: 192.168.2.1/255.255.255.0 設定済み）
fixedNodeIds: [PC1.id, PC2.id]（移動・削除不可）
lockedIpNodeIds: [PC1.id, PC2.id]（IP編集不可）
allowedNodeTypes: ["router", "switch"]
maxCount: { router: 1, switch: 2 }
```

**演習1の正解判定（exercise1-judge.ts）**
```typescript
// JudgeResult を返す関数として実装
export function judgeExercise1(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>
): JudgeResult {
  // 1. PC1-PC2間の疎通確認（同一VLAN）
  // 2. PC3-PC4間の疎通確認（同一VLAN）
  // 3. PC1/PC2 と PC3/PC4 間の非疎通確認（VLAN分離）
  // 全条件クリア → { status: "clear" }
  // 未達条件あり → { status: "failure", reasons: [...] }
}
```

**演習2の正解判定（exercise2-judge.ts）**
```typescript
export function judgeExercise2(
  nodes: Map<NodeId, NetworkNode>,
  links: Map<LinkId, Link>
): JudgeResult {
  // 1. PC1-PC2間の疎通確認
  // 2. 経路にルーターが含まれているか確認
  // 全条件クリア → { status: "clear" }
  // 未達条件あり → { status: "failure", reasons: [...] }
}
```

**JudgeOverlay.tsx**
- クリア時: 画面中央に「CLEAR!!」を大きく表示（半透明オーバーレイ）
  - 「演習一覧に戻る」ボタン（/exercises へ遷移）
- 失敗時: 「NG」と失敗理由のリストを表示
  - 「もう一度」ボタンでオーバーレイを閉じる（judgeResult を null にリセット）

**ExercisePalette.tsx**
- restriction.allowedNodeTypes が空の場合はパレット自体を非表示
- maxCount に達したノード種別はパレット上でグレーアウト・ドラッグ不可

**ExerciseCanvas.tsx**
- restriction.fixedNodeIds に含まれるノードはドラッグ不可
- restriction.fixedNodeIds に含まれるノードの右クリックメニューに「削除」を表示しない

**PcDetail.tsx（演習モード対応）**
- restriction.lockedIpNodeIds に含まれるノードはIPアドレス入力欄をグレーアウト・編集不可

### 状態管理アクション一覧

**SimulatorApp（シミュレーションモード）**
```typescript
type Action =
  | { type: "ADD_NODE";         payload: NetworkNode }
  | { type: "DELETE_NODE";      payload: NodeId }
  | { type: "MOVE_NODE";        payload: { id: NodeId; position: { x: number; y: number } } }
  | { type: "UPDATE_NODE";      payload: NetworkNode }
  | { type: "ADD_LINK";         payload: Link }
  | { type: "DELETE_LINK";      payload: LinkId }
  | { type: "SET_DRAG";         payload: DragState }
  | { type: "SET_LINK_CREATION"; payload: LinkCreationState }
  | { type: "SHOW_CONTEXT_MENU"; payload: ContextMenu }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SELECT_NODE";      payload: NodeId }
  | { type: "DESELECT_NODE" }
  | { type: "START_SIMULATION"; payload: { steps: SimulationStep[]; request: PingRequest | WebRequest } }
  | { type: "NEXT_STEP" }
  | { type: "RESET_SIMULATION" }
  | { type: "LOAD_TOPOLOGY";    payload: TopologyJson };
```

**ExerciseApp（演習モード）**
```typescript
type ExerciseAction =
  | { type: "ADD_NODE";         payload: NetworkNode }
  | { type: "DELETE_NODE";      payload: NodeId }
  | { type: "MOVE_NODE";        payload: { id: NodeId; position: { x: number; y: number } } }
  | { type: "UPDATE_NODE";      payload: NetworkNode }
  | { type: "ADD_LINK";         payload: Link }
  | { type: "DELETE_LINK";      payload: LinkId }
  | { type: "SET_DRAG";         payload: DragState }
  | { type: "SET_LINK_CREATION"; payload: LinkCreationState }
  | { type: "SHOW_CONTEXT_MENU"; payload: ContextMenu }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SELECT_NODE";      payload: NodeId }
  | { type: "DESELECT_NODE" }
  | { type: "SET_JUDGE_RESULT"; payload: JudgeResult }
  | { type: "RESET_JUDGE" };
```

---

## Claude Codeへの最初の指示

Phase 1から開始してください。
`utils/id-generator.ts`・`utils/node-factory.ts`・`domain/topology.ts` を実装し、
`npx tsc --noEmit` でエラーがないことを確認してから報告してください。
