import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} id="top" aria-labelledby="doqtri-brand">
      <div className={styles.inner}>
        <h1 id="doqtri-brand" className={styles.brand}>
          Doqtri
        </h1>
        <p className={styles.headline}>
          Living docs → executable mindmaps.
        </p>
        <p className={styles.support}>
          Planned vs shipped, proven on Stellar.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#map">
            See the map
          </a>
        </div>
      </div>
    </section>
  );
}
