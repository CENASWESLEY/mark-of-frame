import Link from "next/link";
import { Pencil, Star } from "lucide-react";
import type { ArchiveEntry } from "../domain/archive-entry";
import { categoryEnglishLabel } from "../domain/title";
import {
  latestRound,
  statusLabel,
} from "@/modules/watching/domain/watch-round";
import { rankForScore, formatScore } from "@/modules/rankings/domain/score";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import styles from "./title-row.module.css";
import { entryScore, storyViewings, currentViewing } from "../domain/series";
export function TitleRow({
  entry,
  position,
  editable = false,
  href,
  editHref,
}: {
  entry: ArchiveEntry;
  position?: number | null;
  editable?: boolean;
  href?: string;
  editHref?: string;
}) {
  const { title, rounds } = entry;
  const latest = currentViewing(entry) ?? latestRound(rounds),
    score = entryScore(entry),
    count = storyViewings(entry);
  return (
    <article className={styles.row}>
      {position !== undefined && (
        <span
          className={styles.position}
          aria-label={
            position === null
              ? "ยังไม่มีอันดับ"
              : `อันดับ ${position} ใน${categoryEnglishLabel(title.category)}`
          }
        >
          {position === null ? "—" : String(position).padStart(2, "0")}
        </span>
      )}
      <Link
        href={href ?? `/titles/${title.id}`}
        className={styles.cover}
        aria-label={`Open ${title.name}`}
      >
        <Artwork src={title.coverUrl} title={title.name} />
      </Link>
      <div className={styles.details}>
        <h3>
          <Link href={href ?? `/titles/${title.id}`}>{title.name}</Link>
        </h3>
        <p className={styles.metadata}>
          {[
            categoryEnglishLabel(title.category),
            title.releaseYear,
            ...title.genres,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className={styles.synopsis}>
          {title.synopsis || "Synopsis coming soon."}
        </p>
        <div className={styles.foot}>
          <span>{latest ? statusLabel(latest.status) : "อยากดู"}</span>
          {count > 0 && (
            <span className={styles.rewatch}>
              <Star size={12} aria-hidden="true" />
              {count} viewings
            </span>
          )}
          {title.isDemo && <span className="sampleLabel">Sample</span>}
        </div>
      </div>
      <div className={styles.verdict}>
        <RankBadge rank={rankForScore(score)} />
        <div>
          <strong>{formatScore(score)}</strong>
          <small>/ 10</small>
        </div>
      </div>
      {editable && (
        <Link
          className={styles.edit}
          href={editHref ?? `/titles/${title.id}/edit`}
          aria-label={`Edit ${title.name}`}
        >
          <Pencil size={16} aria-hidden="true" />
          <span>Edit</span>
        </Link>
      )}
    </article>
  );
}
