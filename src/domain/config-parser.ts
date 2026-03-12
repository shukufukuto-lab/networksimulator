// =============================================================
// Ciscoコンフィグパーサー
// Router / Switch のCLI設定テキストを解析して型に変換する
// =============================================================

import { generateVlanId } from "@/utils/id-generator";

// -------------------------------------------------------------
// Routerコンフィグパーサー
// 対応コマンド:
//   interface GigabitEthernet0/N
//     ip address <ip> <mask>
//     no shutdown
//   ip route <dest> <mask> <nexthop>
// -------------------------------------------------------------

export function parseRouterConfig(
  configText: string,
  currentInterfaces: RouterInterface[]
): { interfaces: RouterInterface[]; staticRoutes: StaticRoute[] } {
  // 既存インターフェースをコピー（名前をキーにした Map）
  const ifaceMap = new Map<string, RouterInterface>();
  for (const iface of currentInterfaces) {
    ifaceMap.set(iface.name, { ...iface });
  }

  const staticRoutes: StaticRoute[] = [];
  let currentIface: RouterInterface | null = null;

  const lines = configText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // interface GigabitEthernet0/N
    const ifaceMatch = line.match(/^interface\s+(GigabitEthernet\d+\/\d+)$/i);
    if (ifaceMatch) {
      const ifaceName = ifaceMatch[1];
      if (!ifaceMap.has(ifaceName)) {
        // 存在しないIF名はスキップ（新規作成しない）
        currentIface = null;
      } else {
        currentIface = ifaceMap.get(ifaceName)!;
      }
      continue;
    }

    // ip address <ip> <mask>
    const ipMatch = line.match(
      /^ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/i
    );
    if (ipMatch && currentIface) {
      currentIface.ipAddress = ipMatch[1] as IpAddress;
      currentIface.subnetMask = ipMatch[2] as SubnetMask;
      continue;
    }

    // no shutdown
    if (/^no\s+shutdown$/i.test(line) && currentIface) {
      currentIface.shutdown = false;
      continue;
    }

    // shutdown
    if (/^shutdown$/i.test(line) && currentIface) {
      currentIface.shutdown = true;
      continue;
    }

    // ip route <dest> <mask> <nexthop>
    const routeMatch = line.match(
      /^ip\s+route\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/i
    );
    if (routeMatch) {
      currentIface = null; // グローバルコンテキストに戻る
      staticRoutes.push({
        destination: routeMatch[1] as IpAddress,
        mask: routeMatch[2] as SubnetMask,
        nextHop: routeMatch[3] as IpAddress,
      });
      continue;
    }

    // 空行・不明なコマンドはコンテキストをリセットしない
    // （インデントなしのコマンドはコンテキストをリセット）
    if (line.length > 0 && !rawLine.startsWith(" ") && !rawLine.startsWith("\t")) {
      // インデントなし行はinterfaceコンテキスト外
      if (!ifaceMatch && !routeMatch && !line.startsWith("!")) {
        currentIface = null;
      }
    }
  }

  return {
    interfaces: Array.from(ifaceMap.values()),
    staticRoutes,
  };
}

// -------------------------------------------------------------
// Switchコンフィグパーサー
// 対応コマンド:
//   interface vlan <id>
//     ip address <ip> <mask>
//   vlan <id>
//     name <name>
//   interface GigabitEthernet0/N
//     switchport mode access
//     switchport access vlan <id>
// -------------------------------------------------------------

type SwitchContext =
  | { kind: "none" }
  | { kind: "vlan-interface"; vlanId: number }
  | { kind: "vlan-def"; vlanId: number }
  | { kind: "physical-interface"; ifName: string };

export function parseSwitchConfig(configText: string): {
  ipAddress: IpAddress | null;
  subnetMask: SubnetMask | null;
  vlans: Vlan[];
} {
  let ipAddress: IpAddress | null = null;
  let subnetMask: SubnetMask | null = null;
  const vlanMap = new Map<number, Vlan>();

  let ctx: SwitchContext = { kind: "none" };

  const lines = configText.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // interface vlan <id>
    const vlanIfMatch = line.match(/^interface\s+vlan\s+(\d+)$/i);
    if (vlanIfMatch) {
      const vlanId = parseInt(vlanIfMatch[1], 10);
      ctx = { kind: "vlan-interface", vlanId };
      continue;
    }

    // interface GigabitEthernet0/N
    const physIfMatch = line.match(/^interface\s+(GigabitEthernet\d+\/\d+)$/i);
    if (physIfMatch) {
      ctx = { kind: "physical-interface", ifName: physIfMatch[1] };
      continue;
    }

    // vlan <id>
    const vlanDefMatch = line.match(/^vlan\s+(\d+)$/i);
    if (vlanDefMatch) {
      const vlanId = parseInt(vlanDefMatch[1], 10);
      if (!vlanMap.has(vlanId)) {
        vlanMap.set(vlanId, { id: generateVlanId(vlanId), name: "" });
      }
      ctx = { kind: "vlan-def", vlanId };
      continue;
    }

    // ip address <ip> <mask>（vlan-interfaceコンテキスト内）
    const ipMatch = line.match(
      /^ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/i
    );
    if (ipMatch && ctx.kind === "vlan-interface") {
      ipAddress = ipMatch[1] as IpAddress;
      subnetMask = ipMatch[2] as SubnetMask;
      continue;
    }

    // name <name>（vlan-defコンテキスト内）
    const nameMatch = line.match(/^name\s+(.+)$/i);
    if (nameMatch && ctx.kind === "vlan-def") {
      const existing = vlanMap.get(ctx.vlanId);
      if (existing) {
        vlanMap.set(ctx.vlanId, { ...existing, name: nameMatch[1].trim() });
      }
      continue;
    }

    // switchport access vlan <id>（physical-interfaceコンテキスト内）
    const switchportMatch = line.match(/^switchport\s+access\s+vlan\s+(\d+)$/i);
    if (switchportMatch && ctx.kind === "physical-interface") {
      const vlanId = parseInt(switchportMatch[1], 10);
      if (!vlanMap.has(vlanId)) {
        vlanMap.set(vlanId, { id: generateVlanId(vlanId), name: "" });
      }
      continue;
    }

    // switchport mode access は特に状態変更なし（無視）

    // インデントなし行でコンテキストリセット（interfaceやvlan以外）
    if (
      line.length > 0 &&
      !rawLine.startsWith(" ") &&
      !rawLine.startsWith("\t") &&
      !vlanIfMatch &&
      !physIfMatch &&
      !vlanDefMatch &&
      !line.startsWith("!")
    ) {
      ctx = { kind: "none" };
    }
  }

  // vlanMapをVlan[]に変換（id昇順）
  const vlans: Vlan[] = Array.from(vlanMap.values()).sort(
    (a, b) => a.id - b.id
  );

  return { ipAddress, subnetMask, vlans };
}
