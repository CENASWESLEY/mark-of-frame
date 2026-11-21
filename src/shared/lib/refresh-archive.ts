import "server-only";
import { revalidatePath } from "next/cache";

export function refreshArchive(titleId: string): void {
  for (const path of [
    "/year",
    "/manage",
    "/settings",
    "/",
    "/library",
    "/journal",
    `/titles/${titleId}`,
    `/titles/${titleId}/edit`,
  ])
    revalidatePath(path);
}
