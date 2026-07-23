"use client";


import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/WalletContext";
import { shortenAddress } from "@/lib/wallet";
import styles from "./WalletButton.module.css";

type Props = {
  redirectToVault?: boolean;
};

export default function WalletButton({ redirectToVault = false }: Props) {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const router = useRouter();

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
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.btn}
        disabled={connecting}
        aria-label="Connect Stellar wallet"
        title={error ?? "Connect a Stellar wallet"}
        onClick={() => {
          void connect()
            .then(() => {
              if (redirectToVault) router.push("/vault");
            })
            .catch(() => undefined);
        }}
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {error ? <span className={styles.error} role="alert">{error}</span> : null}
    </div>
  );
}
