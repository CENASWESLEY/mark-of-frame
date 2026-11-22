import {
  archiveBackupSchema,
  inspectBackup,
  type BackupInventory,
} from "./archive-backup";
import { seriesOrganizationDocumentSchema } from "./series-organization";
import { z } from "zod";
function readDocument(raw: unknown) {
  const document = seriesOrganizationDocumentSchema.safeParse(raw);
  if (typeof raw === "object" && raw !== null && "organization" in raw) {
    const organization = seriesOrganizationDocumentSchema.parse(raw),
      backup = archiveBackupSchema.parse(raw);
    if (
      JSON.stringify(backup.entries) !==
      JSON.stringify(organization.after.entries)
    )
      throw new Error(
        "The backup and season update contain different records.",
      );
    return { backup, organization };
  }
  if (document.success)
    return { backup: document.data.after, organization: document.data };
  return { backup: archiveBackupSchema.parse(raw), organization: null };
}
export const archiveImportBackupSchema = z
  .unknown()
  .transform((raw, context) => {
    try {
      return readDocument(raw).backup;
    } catch {
      context.addIssue({
        code: "custom",
        message: "This backup or reviewed season update is invalid.",
      });
      return z.NEVER;
    }
  });

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));
/** A reviewed repair applies only to its original collection; elsewhere the file is a normal additive backup. */
export function reviewArchiveImport(raw: unknown, inventory: BackupInventory) {
  const { backup, organization } = readDocument(raw);
  const before = organization?.before.entries;
  const organize = Boolean(
    before &&
    sameIds(
      inventory.titleIds,
      before.map((entry) => entry.title.id),
    ) &&
    sameIds(
      inventory.roundIds,
      before.flatMap((entry) => entry.rounds.map((round) => round.id)),
    ) &&
    sameIds(
      inventory.installmentIds ?? [],
      before.flatMap((entry) => entry.installments.map((part) => part.id)),
    ),
  );
  return {
    backup,
    mode: organize ? ("organize" as const) : ("merge" as const),
    summary: inspectBackup(backup, inventory),
  };
}
