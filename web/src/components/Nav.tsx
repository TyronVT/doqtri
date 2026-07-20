"use client";

import { useEffect, useState } from "react";
import WalletButton from "@/components/WalletButton";
import styles from "./Nav.module.css";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

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
        </ul>
      </nav>
      <WalletButton />
    </header>
  );
}
