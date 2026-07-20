export type NodeStatus = "Planned" | "Building" | "Built" | "Verified";

export type MindmapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  status: NodeStatus;
  tool: string;
  artifactRef: string;
};

export type MindmapEdge = {
  from: string;
  to: string;
};

export const DEMO_DOC = {
  id: "doqtri-launch-plan",
  title: "Doqtri launch plan",
  version: 3,
  contentHash:
    "a3f1c8e2b94d0176e5a82c4f91b0d3e7a6c5f2841d9e0b7a3c6f5e8d2a1b0947",
};

export const DEMO_NODES: MindmapNode[] = [
  {
    id: "root",
    label: "Launch plan",
    x: 480,
    y: 72,
    status: "Verified",
    tool: "—",
    artifactRef: "doc root",
  },
  {
    id: "ingest",
    label: "Doc ingest",
    x: 180,
    y: 220,
    status: "Verified",
    tool: "n8n",
    artifactRef: "wf_ingest_02",
  },
  {
    id: "compile",
    label: "Mindmap compile",
    x: 480,
    y: 220,
    status: "Built",
    tool: "Langflow",
    artifactRef: "flow_compile_v3",
  },
  {
    id: "weekly",
    label: "Weekly report",
    x: 780,
    y: 220,
    status: "Building",
    tool: "n8n",
    artifactRef: "wf_8Xk2p",
  },
  {
    id: "ops",
    label: "Ops dashboard",
    x: 280,
    y: 380,
    status: "Planned",
    tool: "Retool",
    artifactRef: "",
  },
  {
    id: "alerts",
    label: "Ship alerts",
    x: 680,
    y: 380,
    status: "Planned",
    tool: "Make",
    artifactRef: "",
  },
];

export const DEMO_EDGES: MindmapEdge[] = [
  { from: "root", to: "ingest" },
  { from: "root", to: "compile" },
  { from: "root", to: "weekly" },
  { from: "ingest", to: "ops" },
  { from: "compile", to: "alerts" },
  { from: "weekly", to: "alerts" },
];

export const CONTRACT = {
  id: "CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ",
  network: "Stellar Testnet",
  labUrl:
    "https://lab.stellar.org/r/testnet/contract/CCUNGHIVB5Y4Z3VQFGE4JB2K2ZKEALZYFDEH2AXWRFHJ4UEKGYDV66NQ",
  deployTxUrl:
    "https://stellar.expert/explorer/testnet/tx/3ccbf69d08a6ceb6b0dd1222f6c2bd113946a9b1cc23ac5f914f631bba9d56af",
};

export function statusColor(status: NodeStatus): string {
  switch (status) {
    case "Planned":
      return "var(--planned)";
    case "Building":
      return "var(--building)";
    case "Built":
      return "var(--built)";
    case "Verified":
      return "var(--verified)";
  }
}
