import "server-only";
import { loadArchive } from "@/modules/catalog/server/queries";
import { createArchiveBackup } from "@/modules/backup/domain/archive-backup";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(createArchiveBackup(loadArchive()), {
    headers: {
      "Content-Disposition": `attachment; filename="mark-of-frame-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
