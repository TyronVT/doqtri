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

/** Compile ## headings into a simple mindmap layout. */
export function compileMindmap(
  title: string,
  markdown: string,
  prev?: MindmapNode[],
): { nodes: MindmapNode[]; edges: MindmapEdge[] } {
  const prevMap = new Map((prev ?? []).map((n) => [n.id, n]));
  const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) =>
    m[1].trim(),
  );

  const rootId = "root";
  const rootPrev = prevMap.get(rootId);
  const nodes: MindmapNode[] = [
    {
      id: rootId,
      label: title || "Untitled",
      x: 480,
      y: 70,
      status: rootPrev?.status ?? "Planned",
      tool: rootPrev?.tool ?? "",
      artifactRef: rootPrev?.artifactRef ?? "",
    },
  ];
  const edges: MindmapEdge[] = [];

  const cols = Math.max(1, Math.min(4, headings.length || 1));
  headings.forEach((label, i) => {
    let id = slugify(label);
    if (nodes.some((n) => n.id === id)) id = `${id}-${i}`;
    const prevN = prevMap.get(id);
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id,
      label,
      x: 140 + col * 220,
      y: 220 + row * 140,
      status: (prevN?.status as NodeStatus) ?? "Planned",
      tool: prevN?.tool ?? "",
      artifactRef: prevN?.artifactRef ?? "",
    });
    edges.push({ from: rootId, to: id });
  });

  return { nodes, edges };
}

export function createDoc(owner: string, title = "Untitled plan"): VaultDoc {
  const id = `doc-${Date.now().toString(36)}`;
  const markdown = `# ${title}\n\n## First milestone\n\nWrite the plan here. Use ## headings — they become mindmap nodes.\n\n## Ship checklist\n\n`;
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
