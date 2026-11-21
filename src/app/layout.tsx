import type { Metadata } from "next";
import { AppShell } from "@/shared/ui/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Entertaiment — Mark of Frame",
    template: "%s · Mark of Frame",
  },
  description:
    "A personal hall of stories, scores, and memories worth keeping.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
