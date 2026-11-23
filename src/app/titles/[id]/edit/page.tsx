import { notFound } from "next/navigation";
import { loadTitle } from "@/modules/catalog/server/queries";
import { TitleEditPanel } from "@/modules/catalog/ui/title-edit-panel";
import { PageHeading } from "@/shared/ui/page-heading";

export const dynamic = "force-dynamic";
export default async function EditTitlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ part?: string }>;
}) {
  const entry = loadTitle((await params).id);
  if (!entry) notFound();
  return (
    <>
      <PageHeading
        title="Edit the Story"
        description={`Refine the details of ${entry.title.name}. Every viewing and personal memory stays safely in its own chapter.`}
      />
      <TitleEditPanel
        entry={entry}
        selectedPartId={(await searchParams).part}
      />
    </>
  );
}
