import type { MindmapEdge, MindmapNode } from "@/data/demo-map";
import type { VaultDoc } from "@/lib/vault-store";

export type AuditSnapshot = {
  id: string;
  title: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  contentHash: string;
  version: number;
  updatedAt: number;
};

function key(docId: string) {
  return `doqtri.audit.v1.${docId}`;
}

export function saveAuditSnapshot(doc: VaultDoc) {
  if (typeof window === "undefined") return;
  const snap: AuditSnapshot = {
    id: doc.id,
    title: doc.title,
    nodes: doc.nodes,
    edges: doc.edges,
    contentHash: doc.contentHash,
    version: doc.version,
    updatedAt: doc.updatedAt,
  };
  window.localStorage.setItem(key(doc.id), JSON.stringify(snap));
}

export function loadAuditSnapshot(docId: string): AuditSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(docId));
    return raw ? (JSON.parse(raw) as AuditSnapshot) : null;
  } catch {
    return null;
  }
}
