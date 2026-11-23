"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import { formatScore, rankForScore } from "@/modules/rankings/domain/score";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { entryScore, storyViewings } from "../domain/series";
import styles from "./title-card.module.css";

export function TitleCard({
  entry,
  position,
  selected,
  onSelect,
  href,
}: {
  entry: ArchiveEntry;
  position?: number | null;
  href?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { title } = entry;
  const score = entryScore(entry);
  const count = storyViewings(entry);
  const content = (
    <>
      <span className={styles.cover}>
        <Artwork src={title.coverUrl} title={title.name} />
        <span className={styles.rank}>
          <RankBadge rank={rankForScore(score)} size="small" />
        </span>
        {count > 0 && (
          <span className={styles.rewatch} aria-label={`ดูจบทั้งหมด ${count} รอบ`}>
            <Star size={12} aria-hidden="true" />
            {count}
          </span>
        )}
        <span className={styles.preview}>
          <span>{title.genres.join(" · ")}</span>
          <span>{title.synopsis || "Synopsis coming soon."}</span>
        </span>
      </span>
      <span className={styles.caption}>
        {position !== undefined && (
          <span
            className={styles.number}
            aria-label={position === null ? "ยังไม่มีอันดับ" : `อันดับ ${position}`}
          >
            {position === null ? "—" : String(position).padStart(2, "0")}
          </span>
        )}
        <span className={styles.captionBody}>
          <span className={styles.name}>{title.name}</span>
          <span className={styles.meta}>
            <span>{title.releaseYear ?? "ไม่ระบุปี"}</span>
            <span className={styles.score}>{formatScore(score)}</span>
          </span>
          {title.isDemo && <span className={styles.demo}>ตัวอย่าง</span>}
        </span>
      </span>
    </>
  );
  return onSelect ? (
    <button
      type="button"
      className={styles.poster}
      aria-pressed={selected}
      onClick={onSelect}
      aria-label={`เลือก ${title.name} คะแนน ${formatScore(score)}`}
    >
      {content}
    </button>
  ) : (
    <Link className={styles.poster} href={href ?? `/titles/${title.id}`}>
      {content}
    </Link>
  );
}
