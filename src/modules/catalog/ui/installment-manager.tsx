"use client";
import { useActionState, useState } from "react";
import type { ArchiveEntry } from "../domain/archive-entry";
import { orderedInstallments } from "../domain/series";
import { saveInstallmentAction } from "../server/actions";
import { initialActionState } from "@/shared/lib/action-state";
import { FormFeedback } from "@/shared/ui/form-field";

export function InstallmentManager({ entry }: { entry: ArchiveEntry }) {
  const parts = orderedInstallments(entry),
    [selected, setSelected] = useState("");
  const part = parts.find((item) => item.id === selected);
  const [state, action, pending] = useActionState(
    saveInstallmentAction,
    initialActionState,
  );
  return (
    <section className="editorSection">
      <h2>Chapters of the same story</h2>
      <p className="muted">
        Create a season or part, then keep its score, progress and feelings in
        its own viewing history.
      </p>
      <label htmlFor="part-selection">Season / part</label>
      <select
        id="part-selection"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        <option value="">Add a new season / part</option>
        {parts.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <form key={selected} action={action} className="editorForm">
        <input type="hidden" name="titleId" value={entry.title.id} />
        <input type="hidden" name="installmentId" value={part?.id ?? ""} />
        <div className="formGrid">
          {(
            [
              ["name", "ชื่อซีซัน / ภาค", part?.name ?? "", "text"],
              [
                "position",
                "ลำดับภาค",
                part?.position ?? (parts.at(-1)?.position ?? 0) + 1,
                "number",
              ],
              ["releaseYear", "ปีที่ออกฉาย", part?.releaseYear ?? "", "number"],
              [
                "totalEpisodes",
                "จำนวนตอนทั้งหมด",
                part?.totalEpisodes ?? "",
                "number",
              ],
              ["coverUrl", "URL ภาพปก", part?.coverUrl ?? "", "url"],
              ["backdropUrl", "URL ภาพพื้นหลัง", part?.backdropUrl ?? "", "url"],
            ] as const
          ).map(([name, label, value, type]) => (
            <div className="field" key={name}>
              <label htmlFor={`part-${name}`}>{label}</label>
              <input
                id={`part-${name}`}
                name={name}
                type={type}
                defaultValue={value}
                required={name === "name" || name === "position"}
                min={type === "number" ? 1 : undefined}
                max={
                  name === "position"
                    ? 1000
                    : name === "releaseYear"
                      ? 2200
                      : name === "totalEpisodes"
                        ? 100000
                        : undefined
                }
              />
            </div>
          ))}
          <div className="field fieldWide">
            <label htmlFor="part-synopsis">เนื้อเรื่องย่อของภาคนี้</label>
            <textarea
              id="part-synopsis"
              name="synopsis"
              rows={4}
              maxLength={5000}
              defaultValue={part?.synopsis ?? ""}
            />
          </div>
        </div>
        <FormFeedback state={state} />
        <div className="formActions">
          <button className="button" disabled={pending}>
            {pending ? "กำลังบันทึก…" : "บันทึกซีซัน / ภาค"}
          </button>
        </div>
      </form>
    </section>
  );
}
