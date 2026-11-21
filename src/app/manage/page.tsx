import type { Metadata } from "next";
import { loadArchive } from "@/modules/catalog/server/queries";
import { Management } from "@/modules/catalog/ui/management";
import { PageHeading } from "@/shared/ui/page-heading";
export const metadata: Metadata = { title: "Manage collection" };
export const dynamic = "force-dynamic";
export default async function ManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const add = (await searchParams).add === "1";
  return (
    <>
      <PageHeading
        title="The curator’s desk"
        description="A considered home for every detail. Add a new story, refine an old entry, and care for the collection without moving between categories."
      />
      <Management
        key={add ? "add" : "browse"}
        entries={loadArchive()}
        initialAddOpen={add}
      />
    </>
  );
}
