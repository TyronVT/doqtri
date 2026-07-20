import FeatureBlock from "@/components/FeatureBlock";
import MindmapDemo from "@/components/MindmapDemo";
import styles from "./ProductStage.module.css";

export default function ProductStage() {
  return (
    <section className={styles.stage} id="map" aria-label="Product demo">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <FeatureBlock
            id="versions"
            kicker="Versions"
            title="Every change gets a hash."
            copy="Semantic edits bump an on-chain version you can audit."
          />
          <FeatureBlock
            id="shipped"
            kicker="Shipped"
            title="Nodes prove what built."
            copy="Planned → Verified, with tool and artifact on the ledger."
          />
        </div>
        <div className={styles.mapCol}>
          <div className={styles.mapSticky}>
            <MindmapDemo sticky />
          </div>
        </div>
      </div>
    </section>
  );
}
