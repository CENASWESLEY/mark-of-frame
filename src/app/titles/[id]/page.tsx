import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadTitle } from "@/modules/catalog/server/queries";
import { TitleDetail } from "@/modules/catalog/ui/title-detail";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ part?: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = loadTitle((await params).id);
  return { title: entry?.title.name ?? "ไม่พบเรื่อง" };
}
export default async function TitlePage({ params, searchParams }: Props) {
  const entry = loadTitle((await params).id);
  if (!entry) notFound();
  return (
    <TitleDetail entry={entry} selectedPartId={(await searchParams).part} />
  );
}
