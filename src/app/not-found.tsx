import Link from "next/link";

export default function NotFound() {
  return (
    <div className="emptyState">
      <h1>ยังไม่มีเรื่องนี้ในคอลเลกชัน</h1>
      <p>กลับไปเลือกเรื่องที่เก็บไว้ หรือเพิ่มเรื่องใหม่ได้เลย</p>
      <Link href="/library" className="button">
        กลับสู่คลังเรื่อง
      </Link>
    </div>
  );
}
