"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Artwork } from "@/shared/ui/artwork";
import { currentViewing, progressLimit } from "@/modules/catalog/domain/series";
import { progressAction } from "../server/actions";
import { initialActionState } from "@/shared/lib/action-state";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { isEpisodic } from "@/modules/catalog/domain/title";
import styles from "./progress-list.module.css";

function ProgressItem({ entry }: { entry: ArchiveEntry }) {
  const [state, action, pending] = useActionState(
    progressAction,
    initialActionState,
  );
  const round = currentViewing(entry);
  if (!round) return null;
  const total = progressLimit(entry, round.installmentId);
  const href = `/titles/${entry.title.id}${round.installmentId ? `?part=${round.installmentId}` : ""}`;
  const episodic = isEpisodic(entry.title.category);
  return (
    <article className={styles.item}>
      <Link
        href={href}
        className={styles.cover}
        aria-label={`เปิด ${entry.title.name}`}
      >
        <Artwork src={entry.title.coverUrl} title={entry.title.name} />
      </Link>
      <div className={styles.body}>
        <Link href={href}>{entry.title.name}</Link>
        <p>
          <span>{episodic ? `ซีซัน ${round.season}` : "กำลังดู"}</span>
          <span>
            {episodic
              ? `ตอน ${round.episode} / ${total ?? "?"}`
              : entry.title.runtimeMinutes
                ? `${entry.title.runtimeMinutes} นาที`
                : ""}
          </span>
        </p>
        {episodic && total !== null && (
          <progress
            aria-label={`ความคืบหน้า ${entry.title.name}`}
            value={round.episode}
            max={total}
          />
        )}
        {episodic && total === null && <small>ยังไม่ทราบจำนวนตอนทั้งหมด</small>}
        {entry.title.isDemo && <small>ข้อมูลตัวอย่าง</small>}
        {state.message && (
          <small
            className={state.status === "error" ? "errorText" : "muted"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </small>
        )}
      </div>
      {episodic && (
        <form action={action}>
          <input type="hidden" name="titleId" value={entry.title.id} />
          <button
            type="submit"
            className={styles.add}
            disabled={pending || (total !== null && round.episode >= total)}
            aria-label={`ดู ${entry.title.name} เพิ่มหนึ่งตอน`}
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </form>
      )}
    </article>
  );
}

export function ProgressList({ entries }: { entries: ArchiveEntry[] }) {
  const watching = entries.filter((entry) => Boolean(currentViewing(entry)));
  if (!watching.length) return null;
  return (
    <section className={styles.section} aria-label="กำลังดู">
      <div className="sectionHeading">
        <div>
          <h2>Still in the story.</h2>
          <p>
            Some journeys take more than one sitting. Pick up exactly where you
            left off.
          </p>
        </div>
        <span className="muted small">กำลังดู {watching.length} เรื่อง</span>
      </div>
      <div className={styles.list}>
        {watching.map((entry) => (
          <ProgressItem key={entry.title.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
