import Link from "next/link";
import { Pencil, Star } from "lucide-react";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import { formatDate } from "@/shared/lib/format-date";
import { categoryLabel, isEpisodic } from "../domain/title";
import { formatScore, rankForScore } from "@/modules/rankings/domain/score";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import {
  compareRoundsNewestFirst,
  completedViewings,
  latestRound,
  statusLabel,
} from "@/modules/watching/domain/watch-round";
import { WatchEditor } from "@/modules/watching/ui/watch-editor";
import styles from "./title-detail.module.css";

export function TitleDetail({ entry }: { entry: ArchiveEntry }) {
  const { title, rounds } = entry;
  const latest = latestRound(rounds);
  const score = latest?.score ?? null;
  const count = completedViewings(rounds);
  const sorted = [...rounds].sort(compareRoundsNewestFirst);
  return (
    <>
      <div className={styles.top}>
        <Link href="/library" className="quietLink">
          กลับสู่คลังเรื่อง
        </Link>
        <Link href={`/titles/${title.id}/edit`} className="quietLink">
          <Pencil size={15} aria-hidden="true" />
          แก้ไขข้อมูลเรื่อง
        </Link>
      </div>
      <section className={styles.intro}>
        <div className={styles.cover}>
          <Artwork src={title.coverUrl} title={title.name} eager />
        </div>
        <div className={styles.info}>
          <h1>{title.name}</h1>
          {title.originalTitle && title.originalTitle !== title.name && (
            <p className={styles.original}>{title.originalTitle}</p>
          )}
          <p className={styles.metadata}>
            {[
              categoryLabel(title.category),
              title.releaseYear,
              title.runtimeMinutes ? `${title.runtimeMinutes} นาที` : null,
              title.totalEpisodes ? `${title.totalEpisodes} ตอน` : null,
              title.country,
              title.language,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className={styles.genres}>{title.genres.join(" · ")}</p>
          <div className={styles.verdict}>
            <RankBadge rank={rankForScore(score)} size="large" />
            <div>
              <span className={styles.score}>{formatScore(score)}</span>
              <span className="muted"> / 10</span>
              <p className="muted small">
                คะแนนรอบล่าสุด ·{" "}
                {latest ? statusLabel(latest.status) : "ยังไม่มีบันทึกการดู"}
              </p>
            </div>
          </div>
          <p className={styles.rewatch}>
            <Star size={16} aria-hidden="true" />
            ดูจบทั้งหมด {count} รอบ · ดูซ้ำ {Math.max(count - 1, 0)} ครั้ง
          </p>
          {title.synopsis && (
            <p className={styles.synopsis}>{title.synopsis}</p>
          )}
          {title.isDemo && (
            <p className="sampleLabel">ข้อมูลเรื่อง คะแนน และบันทึกตัวอย่าง</p>
          )}
        </div>
      </section>
      <section className={styles.history}>
        <div className="sectionHeading">
          <div>
            <h2>Every viewing, a different feeling.</h2>
            <p>
              The story remains. These are the versions of you that came back to
              it.
            </p>
          </div>
          <span className="muted small">{rounds.length} บันทึก</span>
        </div>
        {!rounds.length && (
          <p className="emptyMessage">
            ยังไม่มีบันทึก เริ่มเขียนความรู้สึกครั้งแรกด้านล่างได้เลย
          </p>
        )}
        {sorted.map((round) => (
          <article className={styles.round} key={round.id}>
            <div className={styles.when}>
              {formatDate(round.finishedOn ?? round.startedOn)}
              <small>
                {statusLabel(round.status)}
                {round.id === latest?.id ? " · รอบล่าสุด" : ""}
              </small>
              {isEpisodic(title.category) && (
                <small>
                  ซีซัน {round.season} · ตอน {round.episode}
                </small>
              )}
            </div>
            <p>{round.note || "ยังไม่ได้เขียนความรู้สึก"}</p>
            <span className={styles.roundScore}>
              {formatScore(round.score)}
            </span>
          </article>
        ))}
      </section>
      <WatchEditor
        titleId={title.id}
        latest={latest}
        totalEpisodes={title.totalEpisodes}
        episodic={isEpisodic(title.category)}
      />
    </>
  );
}
