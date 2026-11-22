"use client";
import { useActionState, useRef, useState } from "react";
import { ArchiveRestore, Download, FileJson, ShieldCheck } from "lucide-react";
import {
  maximumBackupBytes,
  type BackupInventory,
  type ImportSummary,
} from "../domain/archive-backup";
import {
  importBackupAction,
  organizeSeriesAction,
  type BackupActionState,
} from "../server/actions";
import { reviewArchiveImport } from "../domain/archive-import";
import { FormFeedback } from "@/shared/ui/form-field";
import { formatDate } from "@/shared/lib/format-date";
import styles from "./backup-settings.module.css";
import { SeriesOrganization } from "./series-organization";

export function BackupSettings({
  inventory,
  onDownload,
  storageDescription,
}: {
  inventory: BackupInventory;
  onDownload?: () => void;
  storageDescription?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    summary: ImportSummary;
    exportedAt: string;
    titles: number;
    rounds: number;
    mode: "merge" | "organize";
  } | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const version = useRef(0),
    input = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<BackupActionState, FormData>(
    async (previous) => {
      const payload = new FormData();
      if (file)
        payload.set(
          preview?.mode === "organize" ? "organization" : "backup",
          file,
        );
      const result =
        preview?.mode === "organize"
          ? await organizeSeriesAction(previous, payload)
          : await importBackupAction(previous, payload);
      if (result.status === "success") {
        version.current++;
        setFile(null);
        setPreview(null);
        if (input.current) input.current.value = "";
      }
      return result;
    },
    { status: "idle", message: "" },
  );
  async function selectFile(next: File | undefined) {
    const request = ++version.current;
    setFile(null);
    setPreview(null);
    setError("");
    setChecking(false);
    if (!next) return;
    if (next.size > maximumBackupBytes) {
      setError("This file is larger than 8 MB. Choose a smaller backup.");
      return;
    }
    setChecking(true);
    try {
      const raw: unknown = JSON.parse(await next.text());
      if (request !== version.current) return;
      const reviewed = reviewArchiveImport(raw, inventory);
      setFile(next);
      setPreview({
        mode: reviewed.mode,
        summary: reviewed.summary,
        exportedAt: reviewed.backup.exportedAt,
        titles: reviewed.backup.entries.length,
        rounds: reviewed.backup.entries.reduce(
          (sum, entry) => sum + entry.rounds.length,
          0,
        ),
      });
    } catch {
      if (request === version.current)
        setError(
          "This file could not be read as JSON. Nothing has been imported.",
        );
    } finally {
      if (request === version.current) setChecking(false);
    }
  }
  return (
    <div className={styles.settings}>
      <div className={styles.inventory}>
        <ShieldCheck size={18} aria-hidden="true" />
        <span>
          Your archive holds <strong>{inventory.titleIds.length}</strong> titles
          and <strong>{inventory.roundIds.length}</strong> viewing records on
          this device.
          {Boolean(inventory.installmentIds?.length) && (
            <>
              {" "}
              Your seasons: <strong>{inventory.installmentIds?.length}</strong>.
            </>
          )}
        </span>
      </div>
      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <Download size={25} aria-hidden="true" />
          <div>
            <h2>Keep a copy of your story.</h2>
            <p>
              Download your entire collection, including every score, viewing
              date and personal memory. The JSON file can be brought back here
              whenever you need it.
            </p>
          </div>
        </div>
        <a
          href="/api/archive"
          className="button"
          onClick={
            onDownload
              ? (event) => {
                  event.preventDefault();
                  onDownload();
                }
              : undefined
          }
        >
          <Download size={16} aria-hidden="true" />
          Download backup
        </a>
        <p className={styles.note}>
          JSON · Version 2 · Full viewing history · Cover links included; image
          files remain at their original locations.
        </p>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <ArchiveRestore size={25} aria-hidden="true" />
          <div>
            <h2>Bring your memories home.</h2>
            <p>
              Choose a backup and review what it contains before importing. New
              titles and viewings are merged into your archive; existing records
              are kept exactly as they are.
            </p>
          </div>
        </div>
        <form action={action}>
          <label className={styles.fileLabel} htmlFor="backup-file">
            <FileJson size={22} aria-hidden="true" />
            <span>
              Choose a JSON backup<small>Maximum file size: 8 MB</small>
            </span>
            <input
              ref={input}
              id="backup-file"
              type="file"
              accept=".json,application/json"
              disabled={pending}
              onChange={(event) => {
                void selectFile(event.target.files?.[0]);
              }}
            />
          </label>
          {checking && (
            <p className="muted small" role="status">
              Reading and validating your backup…
            </p>
          )}
          {error && (
            <p className="feedback errorText" role="alert">
              {error}
            </p>
          )}
          {preview && (
            <div className={styles.preview} aria-label="Import preview">
              <div className={styles.previewTitle}>
                <h3>
                  {preview.mode === "organize"
                    ? "Season update ready for review"
                    : "Ready for your review"}
                </h3>
                <span>Exported {formatDate(preview.exportedAt)}</span>
              </div>
              <p>
                {preview.titles} titles · {preview.rounds} viewing records
              </p>
              <dl>
                {Boolean(preview.summary.installmentsAdded) && (
                  <div>
                    <dt>New seasons / parts</dt>
                    <dd>{preview.summary.installmentsAdded}</dd>
                  </div>
                )}
                <div>
                  <dt>New titles</dt>
                  <dd>{preview.summary.titlesAdded}</dd>
                </div>
                <div>
                  <dt>New viewings</dt>
                  <dd>{preview.summary.roundsAdded}</dd>
                </div>
                <div>
                  <dt>Existing titles kept</dt>
                  <dd>{preview.summary.titlesKept}</dd>
                </div>
                <div>
                  <dt>Existing viewings kept</dt>
                  <dd>{preview.summary.roundsKept}</dd>
                </div>
              </dl>
              <p className={styles.note}>
                {preview.mode === "organize"
                  ? "This file separates seasons and cleans imported notes for this exact collection. Original text remains in the JSON source archive. If your records have changed since this file was prepared, nothing is applied."
                  : "Merge by record identity. Nothing is removed or overwritten. The entire import is rolled back if any record cannot be saved."}
              </p>
            </div>
          )}
          <div className="formActions">
            <button
              type="submit"
              className="button"
              disabled={!file || !preview || pending}
            >
              <ArchiveRestore size={16} aria-hidden="true" />
              {pending
                ? "Importing…"
                : preview?.mode === "organize"
                  ? "Apply reviewed season update"
                  : "Import reviewed backup"}
            </button>
            {file && (
              <button
                type="button"
                className="quietButton"
                disabled={pending}
                onClick={() => {
                  version.current++;
                  setFile(null);
                  setPreview(null);
                  setError("");
                  if (input.current) input.current.value = "";
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {(!preview || state.status !== "success") && (
            <FormFeedback state={state} />
          )}
        </form>
      </section>
      <SeriesOrganization />
      <section className={styles.privacy}>
        <h2>A personal archive. A local home.</h2>
        <p>
          {storageDescription ??
            "Your data lives in SQLite on this device. This version does not sync to a cloud account. Keep a downloaded backup somewhere you trust, especially before moving to another computer."}
        </p>
      </section>
    </div>
  );
}
