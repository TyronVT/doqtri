import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import type { NodeStatus } from "@/data/demo-map";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from "@/lib/config";
import { hexToBytes32 } from "@/lib/hash";
import { signSorobanTx } from "@/lib/wallet";

type OnChainDocument = {
  content_hash: string | Uint8Array | number[];
  version: number;
  node_count: number;
  updated_at: bigint | number;
  owner?: string;
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

function nodeStatusScVal(status: NodeStatus) {
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(status)]);
}

async function simulate(method: string, ...args: xdr.ScVal[]) {
  const server = new rpc.Server(RPC_URL);
  const contract = new Contract(CONTRACT_ID);
  const source = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
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
    owner: doc.owner ? String(doc.owner) : undefined,
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

async function waitForTx(server: rpc.Server, hash: string) {
  for (let i = 0; i < 30; i++) {
    const res = await server.getTransaction(hash);
    if (res.status === "SUCCESS") return res;
    if (res.status === "FAILED") {
      throw new Error("Transaction failed on-chain");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Timed out waiting for transaction");
}

async function invoke(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[],
) {
  const server = new rpc.Server(RPC_URL);
  const account = await server.getAccount(sourceAddress);
  const contract = new Contract(CONTRACT_ID);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  tx = await server.prepareTransaction(tx);
  const signedXdr = await signSorobanTx(tx.toXDR(), sourceAddress);
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(signed);

  if (sent.status === "ERROR") {
    throw new Error(sent.errorResult?.toXDR("base64") ?? "Send failed");
  }

  await waitForTx(server, sent.hash);
  return sent.hash;
}

export async function registerDocument(
  sourceAddress: string,
  docId: string,
  contentHashHex: string,
) {
  const hash = await invoke(sourceAddress, "register_document", [
    new Address(sourceAddress).toScVal(),
    nativeToScVal(docId, { type: "string" }),
    nativeToScVal(hexToBytes32(contentHashHex)),
  ]);
  return hash;
}

export async function updateDocument(
  sourceAddress: string,
  docId: string,
  contentHashHex: string,
) {
  return invoke(sourceAddress, "update_document", [
    nativeToScVal(docId, { type: "string" }),
    nativeToScVal(hexToBytes32(contentHashHex)),
  ]);
}

export async function setNodeStatus(
  sourceAddress: string,
  docId: string,
  nodeId: string,
  status: NodeStatus,
  tool: string,
  artifactRef: string,
) {
  return invoke(sourceAddress, "set_node_status", [
    nativeToScVal(docId, { type: "string" }),
    nativeToScVal(nodeId, { type: "string" }),
    nodeStatusScVal(status),
    nativeToScVal(tool, { type: "string" }),
    nativeToScVal(artifactRef, { type: "string" }),
  ]);
}
