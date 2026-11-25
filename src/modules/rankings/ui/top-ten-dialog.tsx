"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import type { RankedEntry } from "../domain/rankings";
import { formatScore } from "../domain/score";
import { storyViewings } from "@/modules/catalog/domain/series";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import styles from "./top-ten-dialog.module.css";

export function TopTenDialog({
  open,
  onClose,
  categoryName,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  entries: readonly RankedEntry[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>The All-Time Ten</p>
          <h2 id={headingId}>{categoryName} · Top 10</h2>
          <p id={descriptionId} className={styles.description}>
            {entries.length} stories, kept above the rest. Open a title to
            revisit its details and memories.
          </p>
        </div>
        <button
          className={styles.close}
          type="button"
          aria-label="Close Top 10"
          onClick={close}
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>
      {open && (
        <ol className={styles.list} aria-label={`${categoryName} top ten`}>
          {entries.map((entry) => (
            <li key={entry.title.id}>
              <Link
                className={styles.item}
                href={`/titles/${entry.title.id}?part=overall`}
                onClick={close}
              >
                <span
                  className={styles.position}
                  aria-label={`อันดับ ${entry.position}`}
                >
                  {String(entry.position).padStart(2, "0")}
                </span>
                <span className={styles.cover}>
                  <Artwork
                    src={entry.title.coverUrl}
                    title={entry.title.name}
                  />
                </span>
                <span className={styles.details}>
                  <strong className={styles.name}>{entry.title.name}</strong>
                  <span className={styles.metadata}>
                    {entry.title.releaseYear ?? "Year not recorded"}
                    {entry.title.isDemo && " · Sample"}
                  </span>
                  <span className={styles.verdict}>
                    <RankBadge rank={entry.rank} size="small" />
                    <span className={styles.score}>
                      {formatScore(entry.score)} <small>/ 10</small>
                    </span>
                    <span className={styles.viewings}>
                      <Star size={13} aria-hidden="true" />
                      {storyViewings(entry)} viewings
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </dialog>
  );
}
