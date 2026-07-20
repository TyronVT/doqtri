/**
 * Typed DoqtriRegistry client — thin bindings-style wrapper over Soroban RPC.
 * Prefer this over scattering nativeToScVal calls in UI code.
 */
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
  Account,
} from "@stellar/stellar-sdk";
import type { NodeStatus } from "@/data/demo-map";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from "@/lib/config";
import { hexToBytes32 } from "@/lib/hash";
import { signSorobanTx } from "@/lib/wallet";
import { assertFunded } from "@/lib/horizon";
import { DoqtriError, mapWalletError } from "@/lib/errors";

export type ChainDocument = {
  version: number;
  nodeCount: number;
  contentHash: string;
  updatedAt: number;
  owner?: string;
};

export type ChainNode = {
  status: string;
  tool: string;
  artifactRef: string;
  updatedAt: number;
};

function hashToHex(hash: unknown): string {
  if (typeof hash === "string") return hash;
  const bytes = Uint8Array.from(hash as ArrayLike<number>);
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

function server() {
  return new rpc.Server(RPC_URL);
}

function contract() {
  return new Contract(CONTRACT_ID);
}

async function simulate(method: string, ...args: xdr.ScVal[]) {
  const source = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server().simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) return null;
  return scValToNative(sim.result.retval);
}

async function waitForTx(hash: string) {
  const s = server();
  for (let i = 0; i < 30; i++) {
    const res = await s.getTransaction(hash);
    if (res.status === "SUCCESS") return res;
    if (res.status === "FAILED") {
      throw new DoqtriError("TX_FAILED", "Transaction failed on-chain");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new DoqtriError("TX_TIMEOUT", "Timed out waiting for confirmation");
}

async function invoke(sourceAddress: string, method: string, args: xdr.ScVal[]) {
  await assertFunded(sourceAddress);
  try {
    const account = await server().getAccount(sourceAddress);
    let tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract().call(method, ...args))
      .setTimeout(180)
      .build();

    tx = await server().prepareTransaction(tx);
    const signedXdr = await signSorobanTx(tx.toXDR(), sourceAddress);
    const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const sent = await server().sendTransaction(signed);

    if (sent.status === "ERROR") {
      throw new DoqtriError("SEND_FAILED", "Network rejected the transaction");
    }
    await waitForTx(sent.hash);
    return sent.hash;
  } catch (e) {
    throw mapWalletError(e);
  }
}

export const DoqtriRegistry = {
  async getDocument(docId: string): Promise<ChainDocument | null> {
    const raw = await simulate(
      "get_document",
      nativeToScVal(docId, { type: "string" }),
    );
    if (!raw || typeof raw !== "object") return null;
    const doc = raw as Record<string, unknown>;
    return {
      version: Number(doc.version),
      nodeCount: Number(doc.node_count),
      contentHash: hashToHex(doc.content_hash),
      updatedAt: Number(doc.updated_at),
      owner: doc.owner ? String(doc.owner) : undefined,
    };
  },

  async getNode(docId: string, nodeId: string): Promise<ChainNode | null> {
    const raw = await simulate(
      "get_node",
      nativeToScVal(docId, { type: "string" }),
      nativeToScVal(nodeId, { type: "string" }),
    );
    if (!raw || typeof raw !== "object") return null;
    const node = raw as Record<string, unknown>;
    return {
      status: statusLabel(node.status),
      tool: String(node.tool ?? ""),
      artifactRef: String(node.artifact_ref ?? ""),
      updatedAt: Number(node.updated_at),
    };
  },

  async registerDocument(
    source: string,
    docId: string,
    contentHashHex: string,
  ): Promise<string> {
    try {
      return await invoke(source, "register_document", [
        new Address(source).toScVal(),
        nativeToScVal(docId, { type: "string" }),
        nativeToScVal(hexToBytes32(contentHashHex)),
      ]);
    } catch (e) {
      const err = mapWalletError(e);
      if (err.code === "ALREADY_EXISTS" || /already/i.test(err.message)) {
        // Idempotent: fall through to update
        return DoqtriRegistry.updateDocument(source, docId, contentHashHex);
      }
      throw err;
    }
  },

  async updateDocument(
    source: string,
    docId: string,
    contentHashHex: string,
  ): Promise<string> {
    return invoke(source, "update_document", [
      nativeToScVal(docId, { type: "string" }),
      nativeToScVal(hexToBytes32(contentHashHex)),
    ]);
  },

  async setNodeStatus(
    source: string,
    docId: string,
    nodeId: string,
    status: NodeStatus,
    tool: string,
    artifactRef: string,
  ): Promise<string> {
    return invoke(source, "set_node_status", [
      nativeToScVal(docId, { type: "string" }),
      nativeToScVal(nodeId, { type: "string" }),
      nodeStatusScVal(status),
      nativeToScVal(tool, { type: "string" }),
      nativeToScVal(artifactRef, { type: "string" }),
    ]);
  },
};
