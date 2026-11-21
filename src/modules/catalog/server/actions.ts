"use server";

import { redirect } from "next/navigation";
import { getDatabase } from "@/infrastructure/database/server";
import { titleInputSchema } from "../domain/title";
import { createTitle, TitleRuleError, updateTitle } from "./title-store";
import { refreshArchive } from "@/shared/lib/refresh-archive";
import { validationFailure, type ActionState } from "@/shared/lib/action-state";
import { z } from "zod";

export async function saveTitleAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = titleInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return validationFailure(parsed.error);
  const existing = form.get("id");
  let id: string;
  try {
    const database = getDatabase();
    if (existing) {
      if (
        !z.string().uuid().safeParse(existing).success ||
        typeof existing !== "string"
      )
        return { status: "error", message: "ไม่พบเรื่องที่ต้องการแก้ไข" };
      updateTitle(database, existing, parsed.data);
      id = existing;
    } else {
      id = createTitle(database, parsed.data);
    }
  } catch (error) {
    if (error instanceof TitleRuleError)
      return { status: "error", message: error.message };
    console.error("Title save failed", error);
    return {
      status: "error",
      message: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง ข้อมูลในฟอร์มยังอยู่",
    };
  }
  refreshArchive(id);
  redirect(`/titles/${id}?saved=title`);
}
