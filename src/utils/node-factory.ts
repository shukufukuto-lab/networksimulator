import { generatePortId } from "@/utils/id-generator";

function makeGigabitPorts(): Port[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: generatePortId(),
    name: `GigabitEthernet0/${i}`,
    linkedLinkId: null,
  }));
}

function makeEthPorts(count: number): Port[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generatePortId(),
    name: `eth${i}`,
    linkedLinkId: null,
  }));
}

export function createInitialPorts(type: NodeType): Port[] {
  switch (type) {
    case "router":
    case "switch":
      return makeGigabitPorts();
    case "pc":
      return makeEthPorts(1);
    case "server":
    case "dns-server":
      return makeEthPorts(8);
  }
}
