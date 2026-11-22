import type { Rank } from "@/modules/rankings/domain/score";
import styles from "./rank-badge.module.css";

export function RankBadge({
  rank,
  size = "medium",
}: {
  rank: Rank | null;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span
      className={`${styles.badge} ${styles[size]} ${rank === "S" ? styles.legendary : ""}`}
      role="img"
      aria-label={rank ? `Rank ${rank}` : "Unranked"}
    >
      <span aria-hidden="true">
        {rank?.[0] ?? "—"}
        {rank?.endsWith("+") && <sup className={styles.plus}>+</sup>}
      </span>
    </span>
  );
}
