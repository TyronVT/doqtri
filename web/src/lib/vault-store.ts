import type { MindmapEdge, MindmapNode, NodeStatus } from "@/data/demo-map";

export type VaultDoc = {
  id: string;
  title: string;
  markdown: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  owner: string;
  registered: boolean;
  version: number;
  contentHash: string;
  updatedAt: number;
};

function key(owner: string) {
  return `doqtri.vault.v1.${owner}`;
}

export function listDocs(owner: string): VaultDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(owner));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VaultDoc[];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function saveAll(owner: string, docs: VaultDoc[]) {
  window.localStorage.setItem(key(owner), JSON.stringify(docs));
}

export function getDoc(owner: string, docId: string): VaultDoc | null {
  return listDocs(owner).find((d) => d.id === docId) ?? null;
}

export function upsertDoc(owner: string, doc: VaultDoc) {
  const docs = listDocs(owner);
  const i = docs.findIndex((d) => d.id === doc.id);
  if (i >= 0) docs[i] = doc;
  else docs.unshift(doc);
  saveAll(owner, docs);
}

export function deleteDoc(owner: string, docId: string) {
  saveAll(
    owner,
    listDocs(owner).filter((d) => d.id !== docId),
  );
}

export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "node"
  );
}

type Heading = { level: number; label: string; index: number };

function parseHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  for (const m of markdown.matchAll(/^(#{2,4})\s+(.+)$/gm)) {
    out.push({
      level: m[1].length,
      label: m[2].trim(),
      index: out.length,
    });
  }
  return out;
}

function defaultPosition(
  depth: number,
  siblingIndex: number,
  siblingCount: number,
): { x: number; y: number } {
  const y = 70 + depth * 130;
  if (depth === 0) return { x: 480, y: 70 };
  const span = Math.min(820, 160 + siblingCount * 140);
  const start = 480 - span / 2;
  const step = siblingCount <= 1 ? 0 : span / (siblingCount - 1);
  return { x: start + siblingIndex * step, y };
}

/**
 * Compile ## / ### / #### headings into a nested mindmap.
 * Preserves prior x/y (and status/tool/artifact) when node ids match.
 */
export function compileMindmap(
  title: string,
  markdown: string,
  prev?: MindmapNode[],
): { nodes: MindmapNode[]; edges: MindmapEdge[] } {
  const prevMap = new Map((prev ?? []).map((n) => [n.id, n]));
  const headings = parseHeadings(markdown);

  const rootId = "root";
  const rootPrev = prevMap.get(rootId);
  const nodes: MindmapNode[] = [
    {
      id: rootId,
      label: title || "Untitled",
      x: rootPrev?.x ?? 480,
      y: rootPrev?.y ?? 70,
      status: rootPrev?.status ?? "Planned",
      tool: rootPrev?.tool ?? "",
      artifactRef: rootPrev?.artifactRef ?? "",
      depth: 0,
    },
  ];
  const edges: MindmapEdge[] = [];

  // Stack of (headingLevel, nodeId) for nesting under nearest shallower heading
  const stack: { level: number; id: string }[] = [{ level: 1, id: rootId }];
  const childrenOf = new Map<string, string[]>([[rootId, []]]);

  headings.forEach((h, i) => {
    let id = slugify(h.label);
    if (nodes.some((n) => n.id === id)) id = `${id}-${i}`;

    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    const siblings = childrenOf.get(parent.id) ?? [];
    siblings.push(id);
    childrenOf.set(parent.id, siblings);
    childrenOf.set(id, []);

    const depth = h.level - 1; // ## -> 1, ### -> 2, #### -> 3
    const prevN = prevMap.get(id);
    const pos = defaultPosition(depth, siblings.length - 1, siblings.length);

    nodes.push({
      id,
      label: h.label,
      x: prevN?.x ?? pos.x,
      y: prevN?.y ?? pos.y,
      status: (prevN?.status as NodeStatus) ?? "Planned",
      tool: prevN?.tool ?? "",
      artifactRef: prevN?.artifactRef ?? "",
      depth,
    });
    edges.push({ from: parent.id, to: id });
    stack.push({ level: h.level, id });
  });

  // Re-spread default x for nodes without a prior layout (fresh siblings)
  for (const [, kids] of childrenOf) {
    if (kids.length === 0) continue;
    kids.forEach((kidId, idx) => {
      const node = nodes.find((n) => n.id === kidId);
      if (!node) return;
      const hadPrev = prevMap.has(kidId);
      if (hadPrev) return;
      const depth = node.depth ?? 1;
      const pos = defaultPosition(depth, idx, kids.length);
      node.x = pos.x;
      node.y = pos.y;
    });
  }

  return { nodes, edges };
}

export function createDoc(owner: string, title = "Untitled plan"): VaultDoc {
  const id = `doc-${Date.now().toString(36)}`;
  const markdown = `# ${title}

## First milestone

Outline the work. Nest with ### for sub-nodes.

### Research

### Build

## Ship checklist

`;
  const { nodes, edges } = compileMindmap(title, markdown);
  const doc: VaultDoc = {
    id,
    title,
    markdown,
    nodes,
    edges,
    owner,
    registered: false,
    version: 0,
    contentHash: "",
    updatedAt: Date.now(),
  };
  upsertDoc(owner, doc);
  return doc;
}

/** Merge a chain-discovered doc stub into the local vault if missing. */
export function ensureChainDoc(
  owner: string,
  stub: {
    id: string;
    version: number;
    nodeCount: number;
    contentHash: string;
  },
): VaultDoc {
  const existing = getDoc(owner, stub.id);
  if (existing) {
    const next = {
      ...existing,
      registered: true,
      version: stub.version,
      contentHash: stub.contentHash || existing.contentHash,
      updatedAt: Date.now(),
    };
    upsertDoc(owner, next);
    return next;
  }
  const title = stub.id;
  const markdown = `# ${title}\n\n## Synced from chain\n\n`;
  const { nodes, edges } = compileMindmap(title, markdown);
  const doc: VaultDoc = {
    id: stub.id,
    title,
    markdown,
    nodes,
    edges,
    owner,
    registered: true,
    version: stub.version,
    contentHash: stub.contentHash,
    updatedAt: Date.now(),
  };
  upsertDoc(owner, doc);
  return doc;
}
