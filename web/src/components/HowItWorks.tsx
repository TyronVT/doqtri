import styles from "./HowItWorks.module.css";

const STEPS = ["Doc", "Hash", "Mindmap", "Build", "Stellar"];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how" aria-labelledby="how-title">
      <h2 id="how-title" className={styles.title}>
        How it works
      </h2>
      <ol className={styles.flow}>
        {STEPS.map((step, i) => (
          <li key={step} className={styles.step}>
            {i > 0 ? (
              <span className={styles.arrow} aria-hidden>
                →
              </span>
            ) : null}
            <span className={styles.idx}>{String(i + 1).padStart(2, "0")}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
