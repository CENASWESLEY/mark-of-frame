import Link from "next/link";
import type { ArchiveEntry } from "../domain/archive-entry";
import {
  installmentRounds,
  orderedInstallments,
  partViewings,
} from "../domain/series";
import { latestRound } from "@/modules/watching/domain/watch-round";
import { formatScore, rankForScore } from "@/modules/rankings/domain/score";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import styles from "./title-detail.module.css";

export function SeriesChain({
  entry,
  activeId,
}: {
  entry: ArchiveEntry;
  activeId: string;
}) {
  return (
    <section className={styles.chain} aria-label="Series chain">
      <div className="sectionHeading">
        <div>
          <h2>One story, many chapters.</h2>
          <p>Choose a season to revisit its score and memories.</p>
        </div>
      </div>
      <Link
        className="quietLink"
        href={`/titles/${entry.title.id}?part=overall`}
        aria-current={activeId === "overall" ? "page" : undefined}
      >
        Whole story &amp; overall feelings
      </Link>
      <div className={styles.chainCards}>
        {orderedInstallments(entry).map((part) => {
          const rounds = installmentRounds(entry, part.id),
            score = latestRound(rounds)?.score ?? null;
          return (
            <Link
              key={part.id}
              href={`/titles/${entry.title.id}?part=${part.id}`}
              aria-current={part.id === activeId ? "page" : undefined}
              className={styles.chainCard}
            >
              <div className={styles.chainCover}>
                <Artwork
                  src={part.coverUrl}
                  title={part.name}
                />
              </div>
              <strong>{part.name}</strong>
              <span className="muted small">
                {part.totalEpisodes
                  ? `${part.totalEpisodes} ตอน`
                  : "ไม่ทราบจำนวนตอน"}
              </span>
              <div className={styles.chainBottom}>
                <span className={styles.chainCount}>
                  ดูจบทั้งหมด {partViewings(entry, part.id)} รอบ
                </span>
                <RankBadge rank={rankForScore(score)} size="small" />
                <span className={styles.chainScore}>
                  {formatScore(score)}
                  <small> / 10</small>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
