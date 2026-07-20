"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WalletButton from "@/components/WalletButton";
import { useWallet } from "@/lib/WalletContext";
import styles from "./Nav.module.css";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { address } = useWallet();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <a href="#top" className={styles.brand}>
        Doqtri
      </a>
      <nav aria-label="Primary">
        <ul className={styles.links}>
          <li>
            <a href="#map">Map</a>
          </li>
          <li>
            <a href="#how">How</a>
          </li>
          {address ? (
            <li>
              <Link href="/vault">Vault</Link>
            </li>
          ) : null}
        </ul>
      </nav>
      <WalletButton redirectToVault />
    </header>
  );
}
