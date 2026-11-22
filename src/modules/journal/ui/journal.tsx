import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { Artwork } from "@/shared/ui/artwork";
import { formatDate } from "@/shared/lib/format-date";
import { formatScore } from "@/modules/rankings/domain/score";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { compareRoundsNewestFirst } from "@/modules/watching/domain/watch-round";
import styles from "./journal.module.css";

export function Journal({ entries }: { entries: ArchiveEntry[] }) {
  const notes = entries
    .flatMap((entry) =>
      entry.rounds
        .filter((round) => round.note)
        .map((round) => {
          const part = entry.installments?.find(
            (item) => item.id === round.installmentId,
          );
          return {
            title: part
              ? {
                  ...entry.title,
                  name: `${entry.title.name} — ${part.name}`,
                  coverUrl: part.coverUrl || entry.title.coverUrl,
                }
              : entry.title,
            round,
            href: `/titles/${entry.title.id}${entry.installments?.length ? `?part=${part?.id ?? "overall"}` : ""}`,
          };
        }),
    )
    .sort((a, b) => compareRoundsNewestFirst(a.round, b.round));
  if (!notes.length)
    return (
      <div className="emptyState">
        <NotebookPen size={30} aria-hidden="true" />
        <h2>A memory waiting to be written.</h2>
        <p>
          Open a story you have watched and leave a few words for the person you
          will be when you return.
        </p>
        <Link className="button" href="/library">
          ไปยังคลังเรื่อง
        </Link>
      </div>
    );
  return (
    <div className={styles.list}>
      {notes.map(({ title, round, href }) => (
        <article key={round.id} className={styles.entry}>
          <Link href={href} className={styles.cover}>
            <Artwork src={title.coverUrl} title={title.name} />
          </Link>
          <div className={styles.body}>
            <p className={styles.date}>
              {formatDate(round.finishedOn ?? round.startedOn)}
              {title.isDemo && <span className="sampleLabel">ข้อมูลตัวอย่าง</span>}
            </p>
            <h2>
              <Link href={href}>{title.name}</Link>
            </h2>
            <p className={styles.note}>{round.note}</p>
          </div>
          <span
            className={styles.score}
            aria-label={`คะแนน ${formatScore(round.score)} จาก 10`}
          >
            {formatScore(round.score)}
          </span>
        </article>
      ))}
    </div>
  );
}
