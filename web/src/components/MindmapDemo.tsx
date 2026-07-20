"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_DOC,
  DEMO_EDGES,
  DEMO_NODES,
  type MindmapNode,
  type NodeStatus,
  statusColor,
} from "@/data/demo-map";
import { getDocument, getNode } from "@/lib/soroban";
import styles from "./MindmapDemo.module.css";

function nodeById(id: string): MindmapNode {
  const n = DEMO_NODES.find((x) => x.id === id);
  if (!n) throw new Error(`missing node ${id}`);
  return n;
}

type ChainDoc = {
  version: number;
  nodeCount: number;
  contentHash: string;
};

type ChainNode = {
  status: string;
  tool: string;
  artifactRef: string;
};

type Props = {
  sticky?: boolean;
};

export default function MindmapDemo({ sticky = false }: Props) {
  const [selectedId, setSelectedId] = useState(DEMO_NODES[0].id);
  const [drawn, setDrawn] = useState(false);
  const [chainDoc, setChainDoc] = useState<ChainDoc | null>(null);
  const [chainNode, setChainNode] = useState<ChainNode | null>(null);
  const [chainState, setChainState] = useState<"loading" | "live" | "demo">(
    "loading",
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDrawn(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await getDocument(DEMO_DOC.id);
        if (cancelled) return;
        if (doc) {
          setChainDoc(doc);
          setChainState("live");
        } else {
          setChainState("demo");
        }
      } catch {
        if (!cancelled) setChainState("demo");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setChainNode(null);
    if (chainState !== "live") return;
    (async () => {
      try {
        const node = await getNode(DEMO_DOC.id, selectedId);
        if (!cancelled) setChainNode(node);
      } catch {
        if (!cancelled) setChainNode(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, chainState]);

  const selected = useMemo(
    () => DEMO_NODES.find((n) => n.id === selectedId) ?? DEMO_NODES[0],
    [selectedId],
  );

  const displayStatus = (chainNode?.status as NodeStatus) || selected.status;
  const displayTool = chainNode?.tool || selected.tool;
  const displayArtifact =
    chainNode?.artifactRef || selected.artifactRef || "— not built yet";
  const versionLabel = chainDoc?.version ?? DEMO_DOC.version;
  const hashPreview = (
    chainDoc?.contentHash ?? DEMO_DOC.contentHash
  ).slice(0, 16);

  return (
    <div
      className={`${styles.wrap} ${sticky ? styles.sticky : ""}`}
      aria-labelledby="map-title"
    >
      <div className={styles.header}>
        <h2 id="map-title">{DEMO_DOC.title}</h2>
        <p className={styles.meta}>
          <span className={styles.chip}>v{versionLabel}</span>
          <span className={styles.chip}>{DEMO_NODES.length} nodes</span>
          <span
            className={`${styles.chip} ${
              chainState === "live" ? styles.chipLive : ""
            }`}
          >
            {chainState === "loading"
              ? "syncing…"
              : chainState === "live"
                ? "on-chain"
                : "demo"}
          </span>
        </p>
      </div>

      <div className={styles.stage}>
        <div className={styles.canvas}>
          <svg
            className={`${styles.svg} ${drawn ? styles.drawn : ""}`}
            viewBox="0 0 960 480"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Executable mindmap for the Doqtri launch plan"
          >
            {DEMO_EDGES.map((e, i) => {
              const a = nodeById(e.from);
              const b = nodeById(e.to);
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  className={styles.edge}
                  style={{ animationDelay: `${i * 0.12}s` }}
                  d={`M ${a.x} ${a.y} C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${
                    (a.y + b.y) / 2
                  }, ${b.x} ${b.y}`}
                />
              );
            })}

            {DEMO_NODES.map((node, i) => {
              const color = statusColor(node.status);
              const isSelected = node.id === selectedId;
              const pulse =
                node.status === "Building" || node.status === "Verified";
              return (
                <g
                  key={node.id}
                  className={`${styles.node} ${
                    isSelected ? styles.nodeSelected : ""
                  }`}
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                  transform={`translate(${node.x} ${node.y})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`${node.label}, ${node.status}`}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                >
                  {isSelected ? (
                    <circle
                      className={styles.nodeRing}
                      r={28}
                      stroke={color}
                    />
                  ) : null}
                  {pulse ? (
                    <circle
                      className={styles.nodePulse}
                      r={22}
                      stroke={color}
                    />
                  ) : null}
                  <circle
                    className={styles.nodeCircle}
                    r={22}
                    stroke={color}
                  />
                  <text className={styles.nodeLabel} y={40}>
                    {node.label}
                  </text>
                  <text className={styles.nodeStatus} y={54}>
                    {node.status}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className={styles.panel} aria-live="polite">
          <p className={styles.panelKicker}>Selected node</p>
          <h3 className={styles.panelTitle}>{selected.label}</h3>
          <dl>
            <div className={styles.field}>
              <dt>Status</dt>
              <dd>
                <span
                  className={styles.statusDot}
                  style={{ background: statusColor(displayStatus as NodeStatus) }}
                />
                {displayStatus}
                {chainNode ? (
                  <span className={styles.liveTag}>ledger</span>
                ) : null}
              </dd>
            </div>
            <div className={styles.field}>
              <dt>Builder</dt>
              <dd>{displayTool}</dd>
            </div>
            <div className={styles.field}>
              <dt>Artifact</dt>
              <dd className={styles.mono}>{displayArtifact}</dd>
            </div>
            <div className={styles.field}>
              <dt>Node ID</dt>
              <dd className={styles.mono}>{selected.id}</dd>
            </div>
            <div className={styles.field}>
              <dt>Doc hash</dt>
              <dd className={styles.mono}>{hashPreview}…</dd>
            </div>
          </dl>
          <p className={styles.hint}>
            {chainState === "live" ? "On-chain" : "Demo map"} · click a node
          </p>
        </aside>
      </div>
    </div>
  );
}
