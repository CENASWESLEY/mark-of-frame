import { z } from "zod";
import {
  archiveBackupSchema,
  createArchiveBackup,
  type ArchiveBackup,
} from "./archive-backup";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
/** A reviewed, additive restructuring: identities survive and edited source text is archived. */
export const seriesOrganizationSchema = z
  .object({
    kind: z.literal("series-organization"),
    before: archiveBackupSchema,
    after: archiveBackupSchema,
  })
  .superRefine((plan, context) => {
    if (plan.before.entries.length !== plan.after.entries.length)
      context.addIssue({
        code: "custom",
        message: "Organization cannot add or remove titles.",
      });
    for (const original of plan.before.entries) {
      const target = plan.after.entries.find(
        (entry) => entry.title.id === original.title.id,
      );
      if (
        !target ||
        JSON.stringify(target.title) !== JSON.stringify(original.title)
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Series organization must preserve every title and its metadata.",
        });
        continue;
      }
      for (const part of original.installments) {
        const next = target.installments.find((item) => item.id === part.id);
        if (JSON.stringify(next) !== JSON.stringify(part))
          context.addIssue({
            code: "custom",
            message: "Existing installments must be preserved.",
          });
      }
      for (const round of original.rounds) {
        const changed = target.rounds.find((item) => item.id === round.id);
        if (
          !changed ||
          changed.titleId !== round.titleId ||
          changed.createdAt !== round.createdAt ||
          changed.startedOn !== round.startedOn ||
          changed.finishedOn !== round.finishedOn
        )
          context.addIssue({
            code: "custom",
            message:
              "Series organization must preserve viewing identities and timestamps.",
          });
        if (
          changed &&
          changed.note !== round.note &&
          round.note &&
          !changed.sourceNote.includes(round.note)
        )
          context.addIssue({
            code: "custom",
            message: "Original notes must be preserved in the source archive.",
          });
      }
    }
  });
export type SeriesOrganization = z.output<typeof seriesOrganizationSchema>;
/** Portable backups may carry a reviewed repair for the archive they came from. */
export const seriesOrganizationDocumentSchema = z.union([
  seriesOrganizationSchema,
  z
    .object({ organization: seriesOrganizationSchema })
    .transform((value) => value.organization),
]);
function state(entries: ArchiveEntry[]) {
  return JSON.stringify(
    createArchiveBackup(entries, "2000-01-01T00:00:00.000Z")
      .entries.map((entry) => ({
        ...entry,
        installments: [...entry.installments].sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
        rounds: [...entry.rounds].sort((a, b) => a.id.localeCompare(b.id)),
      }))
      .sort((a, b) => a.title.id.localeCompare(b.title.id)),
  );
}
export function organizedArchive(
  current: ArchiveEntry[],
  plan: SeriesOrganization,
): ArchiveBackup {
  const checked = seriesOrganizationSchema.parse(plan),
    actual = state(current);
  if (actual === state(checked.after.entries)) return checked.after;
  if (actual !== state(checked.before.entries))
    throw new Error(
      "The archive changed after this organization plan was prepared. Export a fresh backup first; nothing was changed.",
    );
  return checked.after;
}
