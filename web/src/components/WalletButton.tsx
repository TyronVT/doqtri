"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";
import { shortenAddress } from "@/lib/wallet";
import styles from "./WalletButton.module.css";

export default function WalletButton() {
  const { address, connecting, connect, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);

  if (address) {
    return (
      <button
        type="button"
        className={styles.btn}
        onClick={() => void disconnect()}
        title="Disconnect"
      >
        <span className={styles.addr}>{shortenAddress(address)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.btn}
      disabled={connecting}
      title={error ?? "Log in with Freighter"}
      onClick={() => {
        setError(null);
        void connect().catch(() =>
          setError("Install Freighter to log in"),
        );
      }}
    >
      {connecting ? "…" : "Log in"}
    </button>
  );
}
