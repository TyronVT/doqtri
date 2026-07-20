import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { CONTRACT } from "@/data/demo-map";

const RPC_URL = "https://soroban-testnet.stellar.org";

type OnChainDocument = {
  content_hash: string | Uint8Array | number[];
  version: number;
  node_count: number;
  updated_at: bigint | number;
};

type OnChainNode = {
  status: unknown;
  tool: string;
  artifact_ref: string;
  updated_at: bigint | number;
};

function hashToHex(hash: OnChainDocument["content_hash"]): string {
  if (typeof hash === "string") return hash;
  const bytes = Uint8Array.from(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function statusLabel(status: unknown): string {
  if (typeof status === "string") return status;
  if (typeof status === "number") {
    return ["Planned", "Building", "Built", "Verified"][status] ?? String(status);
  }
  if (status && typeof status === "object") {
    const s = status as { tag?: string; name?: string };
    if (s.tag) return s.tag;
    if (s.name) return s.name;
  }
  return "Unknown";
}

async function simulate(method: string, ...args: ReturnType<typeof nativeToScVal>[]) {
  const server = new rpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT.id);
  const source = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
    return null;
  }
  return scValToNative(sim.result.retval);
}

export async function getDocument(docId: string) {
  const raw = await simulate(
    "get_document",
    nativeToScVal(docId, { type: "string" }),
  );
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as OnChainDocument;
  return {
    version: Number(doc.version),
    nodeCount: Number(doc.node_count),
    contentHash: hashToHex(doc.content_hash),
    updatedAt: Number(doc.updated_at),
  };
}

export async function getNode(docId: string, nodeId: string) {
  const raw = await simulate(
    "get_node",
    nativeToScVal(docId, { type: "string" }),
    nativeToScVal(nodeId, { type: "string" }),
  );
  if (!raw || typeof raw !== "object") return null;
  const node = raw as OnChainNode;
  return {
    status: statusLabel(node.status),
    tool: String(node.tool ?? ""),
    artifactRef: String(node.artifact_ref ?? ""),
    updatedAt: Number(node.updated_at),
  };
}
