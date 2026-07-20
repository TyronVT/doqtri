"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { syncVaultFromChain } from "@/lib/chain-sync";
import { useWallet } from "@/lib/WalletContext";
import {
  createDoc,
  ensureChainDoc,
  listDocs,
  type VaultDoc,
} from "@/lib/vault-store";
import styles from "./VaultHome.module.css";

export default function VaultHome() {
  const { address } = useWallet();
  const router = useRouter();
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!address) return;
    setDocs(listDocs(address));
  }, [address]);

  const syncFromChain = useCallback(async () => {
    if (!address) return;
    setSyncing(true);
    setSyncNote(null);
    try {
      const owned = await syncVaultFromChain(address);
      for (const stub of owned) {
        ensureChainDoc(address, stub);
      }
      setSyncNote(
        owned.length
          ? `Synced ${owned.length} on-chain doc${owned.length === 1 ? "" : "s"}`
          : "No owned docs found in recent events",
      );
      refresh();
    } catch {
      setSyncNote("Chain sync failed — showing local vault");
      refresh();
    } finally {
      setSyncing(false);
    }
  }, [address, refresh]);

  useEffect(() => {
    refresh();
    void syncFromChain();
  }, [refresh, syncFromChain]);

  if (!address) return null;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Vault</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={syncing}
            onClick={() => void syncFromChain()}
          >
            {syncing ? "Syncing…" : "Sync from chain"}
          </button>
          <button
            type="button"
            className={styles.newBtn}
            onClick={() => {
              const doc = createDoc(address, "Untitled plan");
              router.push(`/vault/${doc.id}`);
            }}
          >
            New plan
          </button>
        </div>
      </div>

      {syncNote ? <p className={styles.syncNote}>{syncNote}</p> : null}

      {docs.length === 0 ? (
        <p className={styles.empty}>
          No plans yet. Create one — write markdown, compile a mindmap, anchor on
          Stellar.
        </p>
      ) : (
        <ul className={styles.list}>
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link href={`/vault/${doc.id}`} className={styles.item}>
                <div className={styles.meta}>
                  <span className={styles.title}>{doc.title}</span>
                  <span className={styles.sub}>
                    {doc.id} · {doc.nodes.length} nodes
                    {doc.registered ? ` · v${doc.version}` : ""}
                  </span>
                </div>
                <span
                  className={`${styles.badge} ${
                    doc.registered ? styles.badgeOn : ""
                  }`}
                >
                  {doc.registered ? "on-chain" : "local"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
