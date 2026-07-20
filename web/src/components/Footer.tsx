import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.cta}>Prove what shipped.</p>
      <a className={styles.primary} href="#map">
        Open the map
      </a>
    </footer>
  );
}
