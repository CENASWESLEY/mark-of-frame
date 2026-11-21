"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="emptyState" role="alert">
      <h1>เปิดคอลเลกชันไม่สำเร็จ</h1>
      <p>ลองโหลดหน้านี้อีกครั้ง หากยังมีปัญหา ตรวจว่าเปิดไฟล์ฐานข้อมูลได้ตามปกติ</p>
      <button className="button" onClick={reset}>
        ลองอีกครั้ง
      </button>
    </div>
  );
}
