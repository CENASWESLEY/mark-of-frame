import { z } from "zod";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import { watchRoundInputSchema } from "@/modules/watching/domain/watch-round";
import {
  archiveBackupSchema,
  maximumBackupBytes,
  type ImportSummary,
} from "@/modules/backup/domain/archive-backup";
import { validationFailure, type ActionState } from "@/shared/lib/action-state";
import { changeArchive } from "./runtime";
import { navigate } from "./navigation";
import { installmentInputSchema } from "@/modules/catalog/domain/installment";
import { seriesOrganizationSchema } from "@/modules/backup/domain/series-organization";

export async function saveInstallmentAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = installmentInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationFailure(parsed.error);
  const id = form.get("installmentId");
  if (id && !z.string().uuid().safeParse(id).success)
    return { status: "error", message: "รหัสภาคไม่ถูกต้อง" };
  try {
    await changeArchive((archive) =>
      archive.saveInstallment(
        parsed.data,
        typeof id === "string" && id ? id : undefined,
      ),
    );
    return { status: "success", message: "บันทึกซีซัน/ภาคแล้ว" };
  } catch (error) {
    return failure(error);
  }
}
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
    const plan = seriesOrganizationSchema.parse(JSON.parse(await file.text()));
    await changeArchive((archive) => archive.organize(plan));
    return {
      status: "success",
      message:
        "Series organized. Your original notes remain in the JSON source archive.",
    };
  } catch (error) {
    return failure(error);
  }
}

export type BackupActionState = ActionState & { summary?: ImportSummary };
const failure = (error: unknown): ActionState => ({
  status: "error",
  message:
    error instanceof Error && error.name !== "QuotaExceededError"
      ? error.message
      : "Browser storage is full or unavailable. Download a backup in Settings before continuing.",
});
export async function saveTitleAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = titleInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationFailure(parsed.error);
  const existing = form.get("id");
  if (existing && !z.string().uuid().safeParse(existing).success)
    return { status: "error", message: "รหัสเรื่องไม่ถูกต้อง" };
  try {
    const id = await changeArchive((archive) => {
      if (
        typeof existing === "string" &&
        existing &&
        !archive.getSnapshot().some((entry) => entry.title.id === existing)
      )
        throw new Error("ไม่พบเรื่องนี้");
      return archive.saveTitle(
        parsed.data,
        typeof existing === "string" && existing ? existing : undefined,
      );
    });
    navigate(`/titles/${id}?saved=title`);
    return { status: "success", message: "บันทึกเรื่องแล้ว" };
  } catch (error) {
    return failure(error);
  }
}
export async function saveRoundAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = watchRoundInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationFailure(parsed.error);
  const roundId = form.get("roundId");
  if (roundId && !z.string().uuid().safeParse(roundId).success)
    return { status: "error", message: "รหัสบันทึกไม่ถูกต้อง" };
  try {
    await changeArchive((archive) =>
      archive.saveRound(
        parsed.data,
        typeof roundId === "string" && roundId ? roundId : undefined,
      ),
    );
    return {
      status: "success",
      message: roundId ? "แก้ไขบันทึกรอบนี้แล้ว" : "เก็บความทรงจำรอบใหม่แล้ว",
    };
  } catch (error) {
    return failure(error);
  }
}
export async function progressAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = z.string().uuid().safeParse(form.get("titleId"));
  if (!id.success) return { status: "error", message: "รหัสเรื่องไม่ถูกต้อง" };
  try {
    await changeArchive((archive) => archive.incrementProgress(id.data));
    return { status: "success", message: "บันทึกตอนที่ดูเพิ่มแล้ว" };
  } catch (error) {
    return failure(error);
  }
}
export async function importBackupAction(
  _: BackupActionState,
  form: FormData,
): Promise<BackupActionState> {
  const file = form.get("backup");
  if (!(file instanceof File) || !file.size || file.size > maximumBackupBytes)
    return {
      status: "error",
      message: "Choose a JSON backup smaller than 8 MB.",
    };
  try {
    const raw: unknown = JSON.parse(await file.text());
    const parsed = archiveBackupSchema.safeParse(raw);
    if (!parsed.success)
      return {
        status: "error",
        message: "This backup is not compatible. No data was changed.",
      };
    const summary = await changeArchive((archive) =>
      archive.merge(parsed.data),
    );
    return {
      status: "success",
      summary,
      message: `Imported ${summary.titlesAdded} titles and ${summary.roundsAdded} viewings. Existing records were kept.`,
    };
  } catch (error) {
    return failure(error);
  }
}
