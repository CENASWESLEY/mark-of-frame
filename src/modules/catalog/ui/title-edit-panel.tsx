import Link from "next/link";
import type { ArchiveEntry } from "../domain/archive-entry";
import { orderedInstallments } from "../domain/series";
import { InstallmentManager } from "./installment-manager";
import { TitleEditor } from "./title-editor";

/** The edit route exposes one write scope at a time, in both application targets. */
export function TitleEditPanel({
  entry,
  selectedPartId,
}: {
  entry: ArchiveEntry;
  selectedPartId?: string | null;
}) {
  const parts = orderedInstallments(entry);
  const editingPart = Boolean(selectedPartId && selectedPartId !== "overall");
  const part = parts.find((item) => item.id === selectedPartId);
  const baseHref = `/titles/${entry.title.id}`;

  if (editingPart && selectedPartId !== "new" && !part)
    return (
      <p className="emptyMessage">
        ไม่พบภาคที่ต้องการแก้ไข{" "}
        <Link href={`${baseHref}/edit`}>กลับไปข้อมูลเรื่องรวม</Link>
      </p>
    );

  return (
    <>
      <nav className="formActions" aria-label="ขอบเขตการแก้ไข">
        <Link
          className="quietLink"
          href={`${baseHref}/edit`}
          aria-current={!editingPart ? "page" : undefined}
        >
          Whole story
        </Link>
        <Link
          className="quietLink"
          href={`${baseHref}/edit?part=${part?.id ?? parts[0]?.id ?? "new"}`}
          aria-current={editingPart ? "page" : undefined}
        >
          Seasons / parts
        </Link>
      </nav>
      {editingPart ? (
        <InstallmentManager
          key={selectedPartId}
          entry={entry}
          initialPartId={part?.id}
        />
      ) : (
        <section className="editorSection" aria-label="ข้อมูลเรื่องรวม">
          <h2>{entry.title.name} · Whole story</h2>
          <p className="muted">
            แก้ไขข้อมูลภาพรวมของเรื่อง ปกนี้ใช้ใน The Hall ส่วนปกแต่ละซีซั่น / ภาคแก้แยกได้ใน
            Seasons / parts
          </p>
          <TitleEditor key={entry.title.id} title={entry.title} />
        </section>
      )}
    </>
  );
}
