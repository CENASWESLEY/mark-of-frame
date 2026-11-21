import type { Metadata } from "next";
import { getDatabase } from "@/infrastructure/database/server";
import { readBackupInventory } from "@/modules/backup/server/backup-store";
import { BackupSettings } from "@/modules/backup/ui/backup-settings";
import { PageHeading } from "@/shared/ui/page-heading";
export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default function SettingsPage() {
  return (
    <>
      <PageHeading
        title="A place for safekeeping"
        description="The collection is yours. Keep every story, score and memory close, with a complete backup you can carry to the next chapter."
      />
      <BackupSettings inventory={readBackupInventory(getDatabase())} />
    </>
  );
}
