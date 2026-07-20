"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MindmapNode, NodeStatus } from "@/data/demo-map";
import { statusColor } from "@/data/demo-map";
import { expertTxUrl } from "@/lib/config";
import { DoqtriError } from "@/lib/errors";
import { rememberDocId } from "@/lib/chain-sync";
import { saveAuditSnapshot } from "@/lib/audit-store";
import { useWallet } from "@/lib/WalletContext";
import { sha256Hex } from "@/lib/hash";
import {
  getDocument,
  registerDocument,
  setNodeStatus,
  updateDocument,
} from "@/lib/soroban";
import {
  compileMindmap,
  getDoc,
  upsertDoc,
  type VaultDoc,
} from "@/lib/vault-store";
import styles from "./DocWorkspace.module.css";

const STATUSES: NodeStatus[] = ["Planned", "Building", "Built", "Verified"];

type TxState = {
  phase: "idle" | "pending" | "done" | "error";
  message: string | null;
  hash: string | null;
};

export default function DocWorkspace({ docId }: { docId: string }) {
  const { address } = useWallet();
  const router = useRouter();
  const [doc, setDoc] = useState<VaultDoc | null>(null);
  const [selectedId, setSelectedId] = useState("root");
  const [tx, setTx] = useState<TxState>({
    phase: "idle",
    message: null,
    hash: null,
  });
  const [copied, setCopied] = useState(false);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!address) return;
    const found = getDoc(address, docId);
    if (!found) {
      router.replace("/vault");
      return;
    }
    setDoc(found);
    setSelectedId(found.nodes[0]?.id ?? "root");
  }, [address, docId, router]);

  const selected = useMemo(
    () => doc?.nodes.find((n) => n.id === selectedId) ?? doc?.nodes[0],
    [doc, selectedId],
  );

  const persist = useCallback(
    (next: VaultDoc) => {
      if (!address) return;
      upsertDoc(address, next);
      saveAuditSnapshot(next);
      setDoc(next);
    },
    [address],
  );

  const onMarkdown = (markdown: string) => {
    if (!doc) return;
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || doc.title;
    const { nodes, edges } = compileMindmap(title, markdown, doc.nodes);
    persist({
      ...doc,
      title,
      markdown,
      nodes,
      edges,
      updatedAt: Date.now(),
    });
  };

  const updateSelected = (patch: Partial<MindmapNode>) => {
    if (!doc || !selected) return;
    persist({
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.id === selected.id ? { ...n, ...patch } : n,
      ),
      updatedAt: Date.now(),
    });
  };

  const clientPoint = (ev: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onNodePointerDown = (id: string, ev: React.PointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setSelectedId(id);
    const node = doc?.nodes.find((n) => n.id === id);
    if (!node) return;
    const p = clientPoint(ev);
    dragRef.current = { id, ox: p.x - node.x, oy: p.y - node.y };
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
  };

  const onMapPointerMove = (ev: React.PointerEvent) => {
    if (!dragRef.current || !doc) return;
    const { id, ox, oy } = dragRef.current;
    const p = clientPoint(ev);
    const x = Math.max(40, Math.min(920, p.x - ox));
    const y = Math.max(40, Math.min(440, p.y - oy));
    setDoc({
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    });
  };

  const onMapPointerUp = () => {
    if (!dragRef.current || !doc || !address) {
      dragRef.current = null;
      return;
    }
    dragRef.current = null;
    persist({ ...doc, updatedAt: Date.now() });
  };

  const runTx = async (
    label: string,
    fn: () => Promise<string>,
    after: (hash: string) => void | Promise<void>,
  ) => {
    setTx({ phase: "pending", message: `${label}…`, hash: null });
    try {
      const hash = await fn();
      await after(hash);
      setTx({
        phase: "done",
        message: `${label} confirmed`,
        hash,
      });
    } catch (e) {
      const msg =
        e instanceof DoqtriError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Transaction failed";
      setTx({ phase: "error", message: msg, hash: null });
    }
  };

  const anchor = async () => {
    if (!doc || !address) return;
    const contentHash = await sha256Hex(doc.markdown);
    const wasRegistered = doc.registered;
    await runTx(
      wasRegistered ? "Update" : "Register",
      () =>
        wasRegistered
          ? updateDocument(address, doc.id, contentHash)
          : registerDocument(address, doc.id, contentHash),
      async () => {
        const onchain = await getDocument(doc.id);
        rememberDocId(doc.id);
        const next: VaultDoc = {
          ...doc,
          registered: true,
          contentHash,
          version: onchain?.version ?? (wasRegistered ? doc.version + 1 : 1),
          updatedAt: Date.now(),
        };
        persist(next);
      },
    );
  };

  const shipNode = async () => {
    if (!doc || !address || !selected) return;
    if (!doc.registered) {
      setTx({
        phase: "error",
        message: "Anchor the document first",
        hash: null,
      });
      return;
    }
    await runTx(
      "Sync node",
      () =>
        setNodeStatus(
          address,
          doc.id,
          selected.id,
          selected.status,
          selected.tool || "manual",
          selected.artifactRef || "",
        ),
      () => {
        saveAuditSnapshot(doc);
      },
    );
  };

  const copyAuditUrl = async () => {
    const url = `${window.location.origin}/d/${docId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setTx({
        phase: "error",
        message: "Could not copy URL",
        hash: null,
      });
    }
  };

  if (!doc) {
    return <div className={styles.workspace} />;
  }

  const busy = tx.phase === "pending";

  return (
    <div className={styles.workspace}>
      <section className={styles.editorPane}>
        <div className={styles.toolbar}>
          <input
            className={styles.titleInput}
            value={doc.title}
            onChange={(e) => {
              const title = e.target.value;
              const markdown = doc.markdown.replace(/^#\s+.+$/m, `# ${title}`);
              const { nodes, edges } = compileMindmap(title, markdown, doc.nodes);
              persist({
                ...doc,
                title,
                markdown,
                nodes,
                edges,
                updatedAt: Date.now(),
              });
            }}
          />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={busy}
            onClick={() => void anchor()}
          >
            {busy ? (
              <span className={styles.spinner} aria-hidden />
            ) : null}
            {doc.registered ? "Update hash" : "Register"}
          </button>
          <span className={styles.status}>
            {doc.registered ? `v${doc.version}` : "local"} ·{" "}
            {doc.contentHash ? `${doc.contentHash.slice(0, 10)}…` : "no hash"}
          </span>
        </div>
        <textarea
          className={styles.editor}
          value={doc.markdown}
          spellCheck={false}
          onChange={(e) => onMarkdown(e.target.value)}
        />
      </section>

      <section className={styles.mapPane}>
        <div className={styles.toolbar}>
          <strong>Mindmap</strong>
          <span className={styles.status}>
            {doc.nodes.length} nodes · drag to rearrange
          </span>
        </div>
        <div className={styles.mapWrap}>
          <svg
            ref={svgRef}
            className={styles.svg}
            viewBox="0 0 960 480"
            role="img"
            aria-label="Plan mindmap"
            onPointerMove={onMapPointerMove}
            onPointerUp={onMapPointerUp}
            onPointerLeave={onMapPointerUp}
          >
            {doc.edges.map((e) => {
              const a = doc.nodes.find((n) => n.id === e.from);
              const b = doc.nodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  className={styles.edge}
                  d={`M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${
                    (a.y + b.y) / 2
                  }, ${b.x} ${b.y}`}
                />
              );
            })}
            {doc.nodes.map((node) => {
              const color = statusColor(node.status);
              const isSelected = node.id === selectedId;
              return (
                <g
                  key={node.id}
                  className={`${styles.node} ${
                    isSelected ? styles.nodeSelected : ""
                  }`}
                  transform={`translate(${node.x} ${node.y})`}
                  onPointerDown={(ev) => onNodePointerDown(node.id, ev)}
                >
                  <circle
                    className={styles.nodeCircle}
                    r={20}
                    stroke={color}
                  />
                  <text className={styles.nodeLabel} y={36}>
                    {node.label}
                  </text>
                  <text className={styles.nodeStatus} y={50}>
                    {node.status}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <aside className={styles.shipPane}>
        <div className={styles.ship}>
          <h2>Ship node</h2>
          {selected ? (
            <>
              <p className={styles.mono}>{selected.id}</p>
              <div className={styles.field}>
                <label>Status</label>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    updateSelected({ status: e.target.value as NodeStatus })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Tool</label>
                <input
                  value={selected.tool}
                  placeholder="n8n / Make / Retool"
                  onChange={(e) => updateSelected({ tool: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Artifact</label>
                <input
                  value={selected.artifactRef}
                  placeholder="wf_id or URL"
                  onChange={(e) =>
                    updateSelected({ artifactRef: e.target.value })
                  }
                />
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={busy}
                onClick={() => void shipNode()}
              >
                {busy ? (
                  <span className={styles.spinner} aria-hidden />
                ) : null}
                Sync to Stellar
              </button>
            </>
          ) : null}

          <div className={styles.shareRow}>
            <Link className={styles.audit} href={`/d/${doc.id}`}>
              Public audit →
            </Link>
            <button
              type="button"
              className={styles.btn}
              onClick={() => void copyAuditUrl()}
            >
              {copied ? "Copied" : "Copy audit URL"}
            </button>
          </div>

          {tx.phase === "pending" ? (
            <p className={`${styles.msg} ${styles.msgPending}`}>
              <span className={styles.spinner} aria-hidden />
              {tx.message}
            </p>
          ) : null}
          {tx.phase === "done" ? (
            <p className={`${styles.msg} ${styles.msgOk}`}>
              {tx.message}
              {tx.hash ? (
                <>
                  {" · "}
                  <a
                    className={styles.txLink}
                    href={expertTxUrl(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on explorer
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {tx.phase === "error" ? (
            <p className={`${styles.msg} ${styles.msgErr}`}>{tx.message}</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
