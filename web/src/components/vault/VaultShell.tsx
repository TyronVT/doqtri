"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import WalletButton from "@/components/WalletButton";
import styles from "./VaultShell.module.css";

export default function VaultShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/vault" className={styles.brand}>
          Doqtri
        </Link>
        <div className={styles.right}>
          <Link href="/vault">Vault</Link>
          <Link href="/">Home</Link>
          <WalletButton />
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
