"use server";

import { z } from "zod";
import { getDatabase } from "@/infrastructure/database/server";
import { watchRoundInputSchema } from "../domain/watch-round";
import { incrementProgress, saveRound, WatchRuleError } from "./watch-store";
import { refreshArchive } from "@/shared/lib/refresh-archive";
import { validationFailure, type ActionState } from "@/shared/lib/action-state";

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
    saveRound(
      getDatabase(),
      parsed.data,
      typeof roundId === "string" && roundId ? roundId : undefined,
    );
  } catch (error) {
    if (error instanceof WatchRuleError)
      return { status: "error", message: error.message };
    console.error("Watch round save failed", error);
    return { status: "error", message: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  refreshArchive(parsed.data.titleId);
  return {
    status: "success",
    message: roundId ? "แก้ไขบันทึกรอบนี้แล้ว" : "เก็บความทรงจำรอบใหม่แล้ว",
  };
}

export async function progressAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = z.string().uuid().safeParse(form.get("titleId"));
  if (!id.success) return { status: "error", message: "รหัสเรื่องไม่ถูกต้อง" };
  try {
    incrementProgress(getDatabase(), id.data);
  } catch (error) {
    if (error instanceof WatchRuleError)
      return { status: "error", message: error.message };
    console.error("Progress update failed", error);
    return { status: "error", message: "อัปเดตไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  refreshArchive(id.data);
  return { status: "success", message: "บันทึกตอนที่ดูเพิ่มแล้ว" };
}
