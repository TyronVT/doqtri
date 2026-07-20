"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FeatureBlock.module.css";

type Props = {
  id: string;
  kicker: string;
  title: string;
  copy: string;
  alternate?: boolean;
};

export default function FeatureBlock({
  id,
  kicker,
  title,
  copy,
  alternate = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`${styles.section} ${alternate ? styles.alt : ""} ${
        visible ? styles.visible : ""
      }`}
    >
      <div className={styles.inner}>
        <p className={styles.kicker}>{kicker}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.copy}>{copy}</p>
      </div>
    </section>
  );
}
