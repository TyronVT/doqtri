"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEMO_EDGES,
  DEMO_NODES,
  statusColor,
  type MindmapEdge,
  type MindmapNode,
} from "@/data/demo-map";
import { loadAuditSnapshot } from "@/lib/audit-store";
import { getDocument, getNode } from "@/lib/soroban";
import styles from "./AuditView.module.css";

type ChainDoc = {
  version: number;
  nodeCount: number;
  contentHash: string;
};

export default function AuditView({ docId }: { docId: string }) {
  const [chain, setChain] = useState<ChainDoc | null>(null);
  const [title, setTitle] = useState(docId);
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [edges, setEdges] = useState<MindmapEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"snapshot" | "demo" | "minimal">("minimal");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const snap = loadAuditSnapshot(docId);
        const doc = await getDocument(docId);
        if (cancelled) return;
        setChain(doc);

        let baseNodes: MindmapNode[];
        let baseEdges: MindmapEdge[];
        let nextTitle = docId;

        if (snap) {
          baseNodes = snap.nodes;
          baseEdges = snap.edges;
          nextTitle = snap.title;
          setSource("snapshot");
        } else if (docId === "doqtri-launch-plan") {
          baseNodes = DEMO_NODES;
          baseEdges = DEMO_EDGES;
          nextTitle = "Doqtri launch plan";
          setSource("demo");
        } else {
          baseNodes = [
            {
              id: "root",
              label: docId,
              x: 480,
              y: 120,
              status: "Planned",
              tool: "",
              artifactRef: "",
            },
          ];
          baseEdges = [];
          setSource("minimal");
        }

        setTitle(nextTitle);

        const enriched = await Promise.all(
          baseNodes.map(async (n) => {
            const on = await getNode(docId, n.id);
            if (!on) return n;
            return {
              ...n,
              status: (on.status as MindmapNode["status"]) || n.status,
              tool: on.tool || n.tool,
              artifactRef: on.artifactRef || n.artifactRef,
            };
          }),
        );
        if (!cancelled) {
          setNodes(enriched);
          setEdges(baseEdges);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docId]);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.brand}>
        Doqtri
      </Link>
      <div className={styles.top}>
        <h1>Audit · {title}</h1>
        <p className={styles.meta}>
          {loading
            ? "loading…"
            : chain
              ? `on-chain v${chain.version} · ${chain.nodeCount} nodes · ${chain.contentHash.slice(0, 16)}…`
              : "not registered on-chain"}
          {!loading ? ` · map: ${source}` : ""}
        </p>
      </div>

      <div className={styles.card}>
        <svg className={styles.svg} viewBox="0 0 960 480" role="img">
          {edges.map((e) => {
            const a = nodes.find((n) => n.id === e.from);
            const b = nodes.find((n) => n.id === e.to);
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
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
              <circle
                className={styles.nodeCircle}
                r={20}
                stroke={statusColor(node.status)}
              />
              <text className={styles.nodeLabel} y={36}>
                {node.label}
              </text>
              <text className={styles.nodeStatus} y={50}>
                {node.status}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ul className={styles.list}>
        {nodes.map((n) => (
          <li key={n.id} className={styles.row}>
            <span>
              {n.label}{" "}
              <span className={styles.muted}>({n.id})</span>
            </span>
            <span className={styles.meta}>
              {n.status}
              {n.tool ? ` · ${n.tool}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
