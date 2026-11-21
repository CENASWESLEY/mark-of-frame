import type { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fields?: Record<string, string[]>;
};
export const initialActionState: ActionState = { status: "idle", message: "" };

export function validationFailure(error: ZodError): ActionState {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fields[key] ??= []).push(issue.message);
  }
  return { status: "error", message: "ตรวจข้อมูลที่ระบุแล้วลองบันทึกอีกครั้ง", fields };
}
