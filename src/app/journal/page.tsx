import type { Metadata } from "next";
import { loadArchive } from "@/modules/catalog/server/queries";
import { Journal } from "@/modules/journal/ui/journal";
import { PageHeading } from "@/shared/ui/page-heading";

export const metadata: Metadata = { title: "ความทรงจำ" };
export const dynamic = "force-dynamic";
export default function JournalPage() {
  return (
    <>
      <PageHeading
        title="Dear Memories"
        description="The same story can find a different person each time. Return to the words you left behind, and remember how it felt before life moved on."
      />
      <Journal entries={loadArchive()} />
    </>
  );
}
