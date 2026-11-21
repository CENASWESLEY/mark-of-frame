import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { SiteApp } from "./app";
import { getBrowserArchive } from "./runtime";
import { archiveStorageKey } from "./archive-store";
import "@/app/globals.css";
import "./site.css";

class ArchiveBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="siteWelcome">
          <h1>Your saved archive needs attention.</h1>
          <p>
            The saved JSON could not be read, or browser storage is unavailable.
            Your stored data has not been replaced. Download a copy before
            repairing it, then try this Site in a browser with storage enabled.
          </p>
          <button
            className="button"
            onClick={() => {
              const raw = localStorage.getItem(archiveStorageKey);
              if (!raw) return;
              const url = URL.createObjectURL(
                new Blob([raw], { type: "application/json" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "mark-of-frame-recovery.json";
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Download saved JSON
          </button>
        </main>
      );
    return this.props.children;
  }
}
window.addEventListener("storage", (event) => {
  if (event.key === archiveStorageKey || event.key === null) {
    try {
      getBrowserArchive().reload();
    } catch {
      window.location.reload();
    }
  }
});
const root = document.getElementById("root");
if (!root) throw new Error("Missing Site root.");
createRoot(root).render(
  <ArchiveBoundary>
    <SiteApp />
  </ArchiveBoundary>,
);
