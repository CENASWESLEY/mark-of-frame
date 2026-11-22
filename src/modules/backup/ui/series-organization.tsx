"use client";
import { useActionState, useRef, useState } from "react";
import { seriesOrganizationSchema } from "../domain/series-organization";
import { maximumBackupBytes } from "../domain/archive-backup";
import { organizeSeriesAction } from "../server/actions";
import { initialActionState } from "@/shared/lib/action-state";
import { FormFeedback } from "@/shared/ui/form-field";

export function SeriesOrganization() {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [error, setError] = useState("");
  const version = useRef(0);
  const [state, action, pending] = useActionState(async () => {
    const form = new FormData();
    if (file) form.set("organization", file);
    const result = await organizeSeriesAction(initialActionState, form);
    if (result.status === "success") {
      setFile(null);
      setPreview("");
    }
    return result;
  }, initialActionState);
  return (
    <section className="editorSection">
      <h2>Give every season its own chapter.</h2>
      <p className="muted">
        Review a series organization file to separate seasons and keep your
        personal feelings clear. Original text stays in the exported source
        archive.
      </p>
      <form action={action} className="editorForm">
        <label htmlFor="series-organization">
          Choose a series organization JSON
        </label>
        <input
          id="series-organization"
          type="file"
          accept=".json,application/json"
          disabled={pending}
          onChange={async (event) => {
            const request = ++version.current,
              next = event.target.files?.[0];
            setFile(null);
            setPreview("");
            setError("");
            if (!next) return;
            try {
              if (next.size > maximumBackupBytes)
                throw new Error("Maximum file size: 8 MB.");
              const plan = seriesOrganizationSchema.parse(
                JSON.parse(await next.text()),
              );
              if (request !== version.current) return;
              setFile(next);
              setPreview(
                `${plan.after.entries.filter((entry) => entry.installments.length).length} series · ${plan.after.entries.reduce((sum, entry) => sum + entry.installments.length, 0)} installments · ${plan.before.entries.length} original titles preserved`,
              );
            } catch {
              if (request === version.current)
                setError("This is not a compatible organization file.");
            }
          }}
        />
        {preview && <p role="status">{preview}</p>}
        {error && (
          <p role="alert" className="errorText">
            {error}
          </p>
        )}
        <div className="formActions">
          <button className="button" disabled={!file || pending}>
            {pending ? "Organizing…" : "Apply reviewed organization"}
          </button>
        </div>
        <FormFeedback state={state} />
      </form>
    </section>
  );
}
