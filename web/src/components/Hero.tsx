import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} id="top" aria-labelledby="doqtri-brand">
      <div className={styles.inner}>
        <h1 id="doqtri-brand" className={styles.brand}>
          Doqtri
        </h1>
        <p className={styles.headline}>
          Your last next plan.
        </p>
        <p className={styles.support}>
          Living docs into executable mindmaps — planned vs shipped, proven on
          Stellar.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/vault">
            Open vault
          </Link>
          <a className={styles.secondary} href="#map">
            See the map
          </a>
        </div>
      </div>
    </section>
  );
}
