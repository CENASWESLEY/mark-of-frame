"use client";

import { useState } from "react";
import { RoundEditor } from "./round-editor";
import type { WatchRound } from "../domain/watch-round";

export function WatchEditor({
  titleId,
  latest,
  totalEpisodes,
  episodic,
}: {
  titleId: string;
  latest: WatchRound | null;
  totalEpisodes: number | null;
  episodic: boolean;
}) {
  const [mode, setMode] = useState<"new" | "edit">(latest ? "edit" : "new");
  return (
    <section className="editorSection" aria-label="จัดการบันทึกการดู">
      <div className="segmentControls">
        {latest && (
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            แก้ไขรอบล่าสุด
          </button>
        )}
        <button
          type="button"
          aria-pressed={mode === "new"}
          onClick={() => setMode("new")}
        >
          เพิ่มรอบใหม่ / ดูซ้ำ
        </button>
      </div>
      <RoundEditor
        key={`${mode}-${latest?.id ?? "empty"}`}
        titleId={titleId}
        round={mode === "edit" ? (latest ?? undefined) : undefined}
        totalEpisodes={totalEpisodes}
        episodic={episodic}
      />
    </section>
  );
}
