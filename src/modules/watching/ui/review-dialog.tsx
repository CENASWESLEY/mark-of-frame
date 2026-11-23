"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { RoundEditor } from "./round-editor";
import type { WatchRound } from "../domain/watch-round";
import styles from "./review-dialog.module.css";

export function ReviewDialog({
  titleId,
  round,
  totalEpisodes,
  episodic,
  installmentId,
  season,
  feelingsOnly,
  label,
}: {
  titleId: string;
  round?: WatchRound;
  totalEpisodes: number | null;
  episodic: boolean;
  installmentId?: string;
  season?: number;
  feelingsOnly?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        className={round ? styles.edit : "button"}
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {round ? (
          <Pencil size={15} aria-hidden="true" />
        ) : (
          <Plus size={17} aria-hidden="true" />
        )}
        {round ? "แก้ไขรีวิว" : "เขียนความทรงจำ"}
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={headingId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            <div>
              <h2 id={headingId}>
                {round ? "Refine this memory" : "Keep this memory"}
              </h2>
              <p>
                Return to how it felt. Your viewing count stays as you set it.
              </p>
            </div>
            <button
              className={styles.close}
              type="button"
              aria-label="ปิดหน้าต่างรีวิว"
              onClick={close}
            >
              <X size={21} aria-hidden="true" />
            </button>
          </div>
          {open && (
            <RoundEditor
              titleId={titleId}
              round={round}
              totalEpisodes={totalEpisodes}
              episodic={episodic}
              installmentId={installmentId}
              season={season}
              feelingsOnly={feelingsOnly}
              onSaved={close}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
