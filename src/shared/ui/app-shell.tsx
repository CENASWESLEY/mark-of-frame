"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, Plus } from "lucide-react";
import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <a
        href="#main-content"
        className="skipLink"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        ข้ามไปเนื้อหา
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>Entertaiment</span>
          <span className={styles.brandSignature}>MARK OF FRAME</span>
        </Link>
        <nav aria-label="เมนูหลัก" className={styles.nav}>
          {[
            { href: "/", label: "The Hall" },
            { href: "/library", label: "Library" },
            { href: "/year", label: "Year in Review" },
            { href: "/journal", label: "Memories" },
            { href: "/manage", label: "Manage" },
            { href: "/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <Link
            href="/manage?add=1#add-entry"
            className="button buttonSmall"
            onClick={() => {
              // A same-URL navigation must also reveal a manually closed native disclosure.
              if (pathname === "/manage") {
                const editor = document
                  .getElementById("add-entry")
                  ?.closest("details");
                if (editor) editor.open = true;
              }
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add title
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={`${styles.main} ${pathname === "/" ? styles.homeMain : ""}`}
      >
        {children}
      </main>
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>MARK OF FRAME</span>
        <span>Our lives, told in the stories we keep.</span>
        <span>
          <LockKeyhole size={12} aria-hidden="true" /> Local, personal, yours.
        </span>
      </footer>
    </div>
  );
}
