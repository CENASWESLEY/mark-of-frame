"use server";

import { archiveImportBackupSchema } from "@/modules/backup/domain/archive-import";

import { revalidatePath } from "next/cache";
import { getDatabase } from "@/infrastructure/database/server";
import {
  maximumBackupBytes,
  type ImportSummary,
} from "../domain/archive-backup";
import { mergeBackup } from "./backup-store";
import { WatchRuleError } from "@/modules/watching/server/watch-store";
import type { ActionState } from "@/shared/lib/action-state";
import { seriesOrganizationDocumentSchema } from "../domain/series-organization";
import { organizeSeries } from "./backup-store";

export async function organizeSeriesAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const file = form.get("organization");
  if (!(file instanceof File) || !file.size || file.size > maximumBackupBytes)
    return {
      status: "error",
      message: "Choose an organization JSON smaller than 8 MB.",
    };
  try {
    const plan = seriesOrganizationDocumentSchema.parse(
      JSON.parse(await file.text()),
    );
    organizeSeries(getDatabase(), plan);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "No changes were saved.",
    };
  }
  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      "Series organized. Original notes are preserved in your JSON source archive.",
  };
}

export type BackupActionState = ActionState & { summary?: ImportSummary };

export async function importBackupAction(
  _: BackupActionState,
  form: FormData,
): Promise<BackupActionState> {
  const file = form.get("backup");
  if (!(file instanceof File) || file.size === 0)
    return { status: "error", message: "Choose a JSON backup first." };
  if (file.size > maximumBackupBytes)
    return {
      status: "error",
      message: "The backup is larger than 8 MB. No data was changed.",
    };
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return {
      status: "error",
      message: "This file is not valid JSON. No data was changed.",
    };
  }
  const parsed = archiveImportBackupSchema.safeParse(raw);
  if (!parsed.success)
    return {
      status: "error",
      message: `This backup is not compatible: ${parsed.error.issues[0]?.message ?? "invalid records"}. No data was changed.`,
    };
  let summary: ImportSummary;
  try {
    summary = mergeBackup(
      getDatabase(),
      parsed.data,
      form.get("refreshMetadata") === "on",
    );
  } catch (error) {
    if (error instanceof WatchRuleError)
      return {
        status: "error",
        message: `${error.message} · Import cancelled; no data was changed.`,
      };
    console.error("Backup merge failed", error);
    return {
      status: "error",
      message: "The import could not finish. All changes were rolled back.",
    };
  }
  revalidatePath("/", "layout");
  return {
    status: "success",
    message: `Imported ${summary.titlesAdded} titles and ${summary.roundsAdded} viewings.${form.get("refreshMetadata") === "on" ? " Metadata refreshed; personal scores, counts and memories were kept." : " Existing records were kept."}`,
    summary,
  };
}
