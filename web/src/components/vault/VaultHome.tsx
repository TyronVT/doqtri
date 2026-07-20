"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import { createDoc, listDocs, type VaultDoc } from "@/lib/vault-store";
import styles from "./VaultHome.module.css";

export default function VaultHome() {
  const { address } = useWallet();
  const router = useRouter();
  const [docs, setDocs] = useState<VaultDoc[]>([]);

  const refresh = useCallback(() => {
    if (!address) return;
    setDocs(listDocs(address));
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!address) return null;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Vault</h1>
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
