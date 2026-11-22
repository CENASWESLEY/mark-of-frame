"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Save } from "lucide-react";
import { watchStatuses, type WatchRound } from "../domain/watch-round";
import { saveRoundAction } from "../server/actions";
import { formatScore } from "@/modules/rankings/domain/score";
import { initialActionState } from "@/shared/lib/action-state";
import { FormFeedback, FormField } from "@/shared/ui/form-field";

export function RoundEditor({
  titleId,
  round,
  totalEpisodes,
  episodic,
  installmentId,
  season,
  feelingsOnly,
}: {
  titleId: string;
  round?: WatchRound;
  totalEpisodes: number | null;
  episodic: boolean;
  installmentId?: string;
  season?: number;
  feelingsOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(
    saveRoundAction,
    initialActionState,
  );
  const [values, setValues] = useState<Record<string, string>>({
    status: round?.status ?? "completed",
    score: round?.score != null ? formatScore(round.score) : "",
    startedOn: round?.startedOn ?? "",
    finishedOn: round?.finishedOn ?? "",
    season: String(round?.season ?? season ?? 1),
    episode: String(round?.episode ?? 0),
    note: round?.note ?? "",
  });
  const common = (name: string) => ({
    id: name,
    name,
    value: values[name] ?? "",
    onChange: (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": Boolean(state.fields?.[name]),
    "aria-describedby": state.fields?.[name] ? `${name}-error` : undefined,
  });
  const field = (name: string) => ({ name, state });
  // FormField ids are unique per mounted editor; only the active editor is mounted by its parent.
  return (
    <form action={action} className="editorForm">
      <input type="hidden" name="titleId" value={titleId} />
      <input
        type="hidden"
        name="installmentId"
        value={installmentId ?? round?.installmentId ?? ""}
      />
      {round && <input type="hidden" name="roundId" value={round.id} />}
      <div className="formGrid">
        <FormField {...field("status")} label="สถานะรอบนี้">
          <select {...common("status")} id="status">
            {watchStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </FormField>
        {!feelingsOnly && (
          <FormField
            {...field("score")}
            label="คะแนนรอบนี้ / 10"
            hint="0–10 ทศนิยมได้ 2 ตำแหน่ง · เว้นว่างได้"
          >
            <input
              {...common("score")}
              id="score"
              type="text"
              inputMode="decimal"
              maxLength={5}
              placeholder="8.65"
            />
          </FormField>
        )}
        {feelingsOnly && <input type="hidden" name="score" value="" />}
        <FormField {...field("startedOn")} label="วันที่เริ่มดู">
          <input {...common("startedOn")} id="startedOn" type="date" />
        </FormField>
        <FormField
          {...field("finishedOn")}
          label="วันที่ดูจบ"
          hint="จำวันที่ไม่ได้ เว้นว่างได้"
        >
          <input {...common("finishedOn")} id="finishedOn" type="date" />
        </FormField>
        {episodic ? (
          <>
            {!installmentId && (
              <FormField {...field("season")} label="ซีซัน">
                <input
                  {...common("season")}
                  id="season"
                  type="number"
                  min={1}
                  max={1000}
                />
              </FormField>
            )}
            {installmentId && (
              <input type="hidden" name="season" value={season ?? 1} />
            )}
            <FormField {...field("episode")} label="ดูถึงตอนที่">
              <input
                {...common("episode")}
                id="episode"
                type="number"
                min={0}
                max={totalEpisodes ?? 100000}
              />
            </FormField>
          </>
        ) : (
          <>
            <input type="hidden" name="season" value="1" />
            <input type="hidden" name="episode" value="0" />
          </>
        )}
        <FormField {...field("note")} label="ความรู้สึกในครั้งนี้" wide>
          <textarea
            {...common("note")}
            id="note"
            rows={6}
            maxLength={20000}
            placeholder="อะไรที่ทำให้ยังนึกถึงเรื่องนี้อยู่…"
          />
        </FormField>
      </div>
      <FormFeedback state={state} />
      <div className="formActions">
        <button type="submit" className="button" disabled={pending}>
          <Save size={16} aria-hidden="true" />
          {pending ? "กำลังบันทึก…" : round ? "บันทึกการแก้ไข" : "เก็บความทรงจำรอบใหม่"}
        </button>
      </div>
      <p className="muted small">
        คะแนนรอบล่าสุดเป็นคะแนนที่ใช้จัดอันดับ · บันทึกรอบก่อนยังอยู่ครบ
      </p>
    </form>
  );
}
