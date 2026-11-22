import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { sampleBackup } from "@/site/sample";
import {
  archiveImportBackupSchema,
  reviewArchiveImport,
} from "./archive-import";
import {
  seriesOrganizationSchema,
  organizedArchive,
} from "./series-organization";
const inventory = (entries: ReturnType<typeof sampleBackup>["entries"]) => ({
  titleIds: entries.map((entry) => entry.title.id),
  roundIds: entries.flatMap((entry) => entry.rounds.map((round) => round.id)),
  installmentIds: entries.flatMap((entry) =>
    entry.installments.map((part) => part.id),
  ),
});
function fixture() {
  const before = sampleBackup(),
    after = structuredClone(before),
    entry = after.entries[0]!;
  entry.installments.push({
    id: randomUUID(),
    titleId: entry.title.id,
    name: "Season 1",
    position: 1,
    releaseYear: null,
    coverUrl: "",
    backdropUrl: "",
    synopsis: "",
    totalEpisodes: null,
  });
  const organization = seriesOrganizationSchema.parse({
    kind: "series-organization",
    before,
    after,
  });
  return { ...after, organization };
}
describe("portable season repair import", () => {
  it("offers a reviewed organization when importing into the original archive", () => {
    const file = fixture(),
      review = reviewArchiveImport(
        file,
        inventory(file.organization.before.entries),
      );
    expect(review.mode).toBe("organize");
    expect(review.summary.installmentsAdded).toBe(1);
  });
  it("restores the same portable file into an empty archive through ordinary merge", () => {
    const file = fixture();
    expect(reviewArchiveImport(file, inventory([])).mode).toBe("merge");
    expect(archiveImportBackupSchema.parse(file).entries).toEqual(file.entries);
  });
  it("merges additively into another collection without selecting an exact repair", () => {
    const file = fixture(),
      current = structuredClone(file.organization.before.entries);
    current[0]!.rounds.push({ ...current[0]!.rounds[0]!, id: randomUUID() });
    expect(reviewArchiveImport(file, inventory(current)).mode).toBe("merge");
  });
  it("rejects a corrupt or mismatched embedded plan instead of silently changing the import mode", () => {
    const file = fixture();
    file.entries[0]!.title.name = "Different record";
    expect(archiveImportBackupSchema.safeParse(file).success).toBe(false);
    expect(() => reviewArchiveImport(file, inventory([]))).toThrow();
  });
  it("still rejects a stale collection with the same identities but edited memories", () => {
    const file = fixture(),
      current = structuredClone(file.organization.before.entries);
    current[0]!.rounds[0]!.note = "A later personal edit";
    expect(reviewArchiveImport(file, inventory(current)).mode).toBe("organize");
    expect(() => organizedArchive(current, file.organization)).toThrow(
      /changed/,
    );
  });
});
