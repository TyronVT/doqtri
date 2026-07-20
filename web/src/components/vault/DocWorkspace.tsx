"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MindmapNode, NodeStatus } from "@/data/demo-map";
import { statusColor } from "@/data/demo-map";
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

export default function DocWorkspace({ docId }: { docId: string }) {
  const { address } = useWallet();
  const router = useRouter();
  const [doc, setDoc] = useState<VaultDoc | null>(null);
  const [selectedId, setSelectedId] = useState("root");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const anchor = async () => {
    if (!doc || !address) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const contentHash = await sha256Hex(doc.markdown);
      if (!doc.registered) {
        await registerDocument(address, doc.id, contentHash);
        const onchain = await getDocument(doc.id);
        persist({
          ...doc,
          registered: true,
          contentHash,
          version: onchain?.version ?? 1,
          updatedAt: Date.now(),
        });
        setMsg("Registered on Stellar");
      } else {
        await updateDocument(address, doc.id, contentHash);
        const onchain = await getDocument(doc.id);
        persist({
          ...doc,
          contentHash,
          version: onchain?.version ?? doc.version + 1,
          updatedAt: Date.now(),
        });
        setMsg(`Updated to v${onchain?.version ?? doc.version + 1}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Anchor failed");
    } finally {
      setBusy(false);
    }
  };

  const shipNode = async () => {
    if (!doc || !address || !selected) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (!doc.registered) {
        throw new Error("Anchor the document first");
      }
      await setNodeStatus(
        address,
        doc.id,
        selected.id,
        selected.status,
        selected.tool || "manual",
        selected.artifactRef || "",
      );
      setMsg(`Node “${selected.label}” synced on-chain`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ship failed");
    } finally {
      setBusy(false);
    }
  };

  if (!doc) {
    return <div className={styles.workspace} />;
  }

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
          <span className={styles.status}>{doc.nodes.length} nodes</span>
        </div>
        <div className={styles.mapWrap}>
          <svg
            className={styles.svg}
            viewBox="0 0 960 480"
            role="img"
            aria-label="Plan mindmap"
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
                  onClick={() => setSelectedId(node.id)}
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
                Sync to Stellar
              </button>
            </>
          ) : null}
          <Link className={styles.audit} href={`/d/${doc.id}`}>
            Public audit →
          </Link>
          {msg ? <p className={`${styles.msg} ${styles.msgOk}`}>{msg}</p> : null}
          {err ? <p className={`${styles.msg} ${styles.msgErr}`}>{err}</p> : null}
        </div>
      </aside>
    </div>
  );
}
