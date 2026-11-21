import type { Metadata } from "next";
import { loadArchive } from "@/modules/catalog/server/queries";
import { Library } from "@/modules/catalog/ui/library";
import { PageHeading } from "@/shared/ui/page-heading";

export const metadata: Metadata = { title: "คลังเรื่อง" };
export const dynamic = "force-dynamic";
export default function LibraryPage() {
  return (
    <>
      <PageHeading
        title="The Collection"
        description="Every story that has crossed your path, kept in one personal collection. Find the ones that stayed with you, and return to the details you never want to lose."
      />
      <Library entries={loadArchive()} />
    </>
  );
}
