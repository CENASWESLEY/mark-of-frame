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
import { activePart, entryScore, installmentRounds } from "../domain/series";
import { SeriesChain } from "./series-chain";

export function TitleDetail({
  entry,
  selectedPartId,
}: {
  entry: ArchiveEntry;
  selectedPartId?: string | null;
}) {
  const part = activePart(entry, selectedPartId);
  const title = part
    ? {
        ...entry.title,
        name: `${entry.title.name} — ${part.name}`,
        releaseYear: part.releaseYear ?? entry.title.releaseYear,
        coverUrl: part.coverUrl || entry.title.coverUrl,
        totalEpisodes: part.totalEpisodes,
        synopsis: part.synopsis || entry.title.synopsis,
      }
    : entry.title;
  const rounds = entry.installments?.length
    ? installmentRounds(entry, part?.id ?? null)
    : entry.rounds;
  const latest = latestRound(rounds);
  const score =
    !part && entry.installments?.length
      ? entryScore(entry)
      : (latest?.score ?? null);
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
          <h1>{entry.title.name}</h1>
          {part && <p className={styles.partName}>{part.name}</p>}
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
                {!part && entry.installments?.length
                  ? "คะแนนภาพรวมของเรื่อง"
                  : "คะแนนรอบล่าสุด"}{" "}
                · {latest ? statusLabel(latest.status) : "ยังไม่มีบันทึกการดู"}
              </p>
            </div>
          </div>
          <p className={styles.rewatch}>
            <Star size={16} aria-hidden="true" />
            ดูจบทั้งหมด {count} รอบ · ดูซ้ำ {Math.max(count - 1, 0)} ครั้ง
          </p>
          {title.isDemo && (
            <p className="sampleLabel">ข้อมูลเรื่อง คะแนน และบันทึกตัวอย่าง</p>
          )}
        </div>
      </section>
      {Boolean(entry.installments?.length) && (
        <SeriesChain entry={entry} activeId={part?.id ?? "overall"} />
      )}
      {title.synopsis && <p className={styles.synopsis}>{title.synopsis}</p>}
      {part && (
        <p className={styles.seriesSummary}>
          Series overall · {formatScore(entryScore(entry))} / 10
        </p>
      )}
      {part && installmentRounds(entry).some((round) => round.note) && (
        <section className={styles.history}>
          <h2>Feelings about the whole story</h2>
          {installmentRounds(entry)
            .filter((round) => round.note)
            .map((round) => (
              <article key={round.id} className={styles.overallFeeling}>
                <span className="muted small">
                  {formatDate(round.finishedOn ?? round.startedOn)}
                </span>
                <p>{round.note}</p>
              </article>
            ))}
        </section>
      )}
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
        feelingsOnly={!part && Boolean(entry.installments?.length)}
        key={part?.id ?? title.id}
        installmentId={part?.id}
        season={part?.position}
        titleId={title.id}
        latest={latest}
        totalEpisodes={title.totalEpisodes}
        episodic={isEpisodic(title.category)}
      />
    </>
  );
}
