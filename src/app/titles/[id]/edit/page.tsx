import { notFound } from "next/navigation";
import { loadTitle } from "@/modules/catalog/server/queries";
import { TitleEditor } from "@/modules/catalog/ui/title-editor";
import { PageHeading } from "@/shared/ui/page-heading";
import { InstallmentManager } from "@/modules/catalog/ui/installment-manager";

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
      <TitleEditor title={entry.title} />
      <InstallmentManager
        entry={entry}
        initialPartId={(await searchParams).part}
      />
    </>
  );
}
