"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import styles from "./AuthGate.module.css";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { address, connecting, error, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connecting && !address) {
      // stay on gate UI
    }
  }, [address, connecting]);

  if (connecting) {
    return (
      <div className={styles.gate}>
        <p>Connecting…</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className={styles.gate}>
        <h1 data-testid="vault-gate">Open your vault</h1>
        <p>Connect a Stellar wallet to manage plans on Stellar testnet.</p>
        <button type="button" onClick={() => void connect().catch(() => undefined)}>
          Connect wallet
        </button>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button type="button" className={styles.link} onClick={() => router.push("/")}>
          Back to home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
