let nodeSeq = 0;
let linkSeq = 0;

export function generateNodeId(): NodeId {
  return `node-${++nodeSeq}-${Date.now()}` as NodeId;
}

export function generateLinkId(): LinkId {
  return `link-${++linkSeq}-${Date.now()}` as LinkId;
}

export function generateVlanId(id: number): VlanId {
  return id as VlanId;
}
