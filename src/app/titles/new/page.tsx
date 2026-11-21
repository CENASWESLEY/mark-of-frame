import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "เพิ่มเรื่อง" };
export default function NewTitlePage() {
  redirect("/manage?add=1#add-entry");
}
