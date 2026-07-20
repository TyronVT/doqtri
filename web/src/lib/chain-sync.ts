import { rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL } from "@/lib/config";
import { DoqtriRegistry } from "@/lib/contract-client";

const INDEX_KEY = "doqtri.chainDocs.v1";

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(INDEX_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function rememberDocId(docId: string) {
  if (typeof window === "undefined") return;
  const set = new Set(readIndex());
  set.add(docId);
  window.localStorage.setItem(INDEX_KEY, JSON.stringify([...set]));
}

/** Discover registered doc IDs from recent contract events + local index. */
export async function discoverDocIds(): Promise<string[]> {
  const found = new Set(readIndex());
  try {
    const server = new rpc.Server(RPC_URL);
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - 50_000);
    const page = await server.getEvents({
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
        },
      ],
      limit: 200,
    });

    for (const ev of page.events ?? []) {
      try {
        // register payload is doc_id string
        const topics = ev.topic?.map((t) => {
          try {
            return scValToNative(t as xdr.ScVal);
          } catch {
            return null;
          }
        });
        const topicStr = (topics ?? []).map(String).join(",");
        if (topicStr.includes("register") || topicStr.includes("doqtri")) {
          const value = scValToNative(ev.value as xdr.ScVal);
          if (typeof value === "string" && value.length > 0) {
            found.add(value);
          }
        }
      } catch {
        // ignore malformed events
      }
    }
  } catch {
    // RPC event scan optional — local index still works
  }
  return [...found];
}

export async function syncVaultFromChain(owner: string) {
  const ids = await discoverDocIds();
  const owned: {
    id: string;
    version: number;
    nodeCount: number;
    contentHash: string;
  }[] = [];

  for (const id of ids) {
    const doc = await DoqtriRegistry.getDocument(id);
    if (!doc) continue;
    if (doc.owner && doc.owner !== owner) continue;
    // If owner field missing from decode, still include if in local index after register
    owned.push({
      id,
      version: doc.version,
      nodeCount: doc.nodeCount,
      contentHash: doc.contentHash,
    });
    rememberDocId(id);
  }
  return owned;
}
