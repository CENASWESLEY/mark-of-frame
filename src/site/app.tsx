import { useState, useSyncExternalStore } from "react";
import { AppShell } from "@/shared/ui/app-shell";
import { PageHeading } from "@/shared/ui/page-heading";
import { HallOfFame } from "@/modules/rankings/ui/hall-of-fame";
import { ProgressList } from "@/modules/watching/ui/progress-list";
import { Library } from "@/modules/catalog/ui/library";
import { Journal } from "@/modules/journal/ui/journal";
import { Management } from "@/modules/catalog/ui/management";
import { TitleDetail } from "@/modules/catalog/ui/title-detail";
import { TitleEditor } from "@/modules/catalog/ui/title-editor";
import { InstallmentManager } from "@/modules/catalog/ui/installment-manager";
import { BackupSettings } from "@/modules/backup/ui/backup-settings";
import { YearReview } from "@/modules/insights/ui/year-review";
import { YearPicker } from "@/modules/insights/ui/year-picker";
import {
  availableReviewYears,
  buildYearReview,
} from "@/modules/insights/domain/year-review";
import { createArchiveBackup } from "@/modules/backup/domain/archive-backup";
import { currentBangkokYear } from "@/shared/lib/current-year";
import { inventoryOf } from "./archive-store";
import { changeArchive, getBrowserArchive } from "./runtime";
import SiteLink, { useSiteLocation } from "./navigation";
import { sampleBackup } from "./sample";

function downloadBackup() {
  const backup = createArchiveBackup(getBrowserArchive().getSnapshot());
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `mark-of-frame-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SiteApp() {
  const archive = getBrowserArchive();
  const entries = useSyncExternalStore(archive.subscribe, archive.getSnapshot);
  const location = useSiteLocation(),
    path = location.pathname;
  const [sampleError, setSampleError] = useState("");
  let content: React.ReactNode;
  if (path === "/")
    content = (
      <>
        {!entries.length && (
          <section className="siteWelcome">
            <h1>Make room for the stories that stay.</h1>
            <p>
              Add your first title, or bring a JSON backup into Settings. Your
              collection stays in this browser; export a copy whenever you want
              to carry it somewhere new.
            </p>
            <div className="formActions">
              <SiteLink href="/manage?add=1#add-entry" className="button">
                Add your first story
              </SiteLink>
              <SiteLink href="/settings" className="quietLink">
                Import JSON
              </SiteLink>
              <button
                type="button"
                className="quietButton"
                onClick={() => {
                  void changeArchive((store) =>
                    store.merge(sampleBackup()),
                  ).catch((error: unknown) =>
                    setSampleError(
                      error instanceof Error
                        ? error.message
                        : "Samples could not be loaded.",
                    ),
                  );
                }}
              >
                Explore labeled samples
              </button>
            </div>
            {sampleError && <p role="alert">{sampleError}</p>}
          </section>
        )}
        <HallOfFame entries={entries} />
        <ProgressList entries={entries} />
      </>
    );
  else if (path === "/library")
    content = (
      <>
        <PageHeading
          title="The Collection"
          description="Every story that has crossed your path, kept in one personal collection. Find the ones that stayed with you, and return to the details you never want to lose."
        />
        <Library entries={entries} />
      </>
    );
  else if (path === "/journal")
    content = (
      <>
        <PageHeading
          title="Dear Memories"
          description="The same story can find a different person each time. Return to the words you left behind, and remember how it felt before life moved on."
        />
        <Journal entries={entries} />
      </>
    );
  else if (path === "/manage" || path === "/titles/new") {
    const add =
      path === "/titles/new" || location.searchParams.get("add") === "1";
    content = (
      <>
        <PageHeading
          title="The curator’s desk"
          description="A considered home for every detail. Add a new story, refine an old entry, and care for the collection without moving between categories."
        />
        <Management
          key={add ? "add" : "browse"}
          entries={entries}
          initialAddOpen={add}
        />
      </>
    );
  } else if (path === "/settings")
    content = (
      <>
        <PageHeading
          title="A place for safekeeping"
          description="The collection is yours. Keep every story, score and memory close, with a complete backup you can carry to the next chapter."
        />
        <BackupSettings
          inventory={inventoryOf(entries)}
          onDownload={downloadBackup}
          storageDescription="Your collection is stored as JSON in this browser, with no cloud database or automatic sync. Export regularly: clearing browser data removes the local copy. To use another browser or device, import your downloaded JSON there."
        />
      </>
    );
  else if (path === "/year") {
    const requested = location.searchParams.get("year"),
      current = currentBangkokYear();
    const year =
      requested && /^\d{4}$/.test(requested) && Number(requested) > 0
        ? Number(requested)
        : current;
    const years = availableReviewYears(entries, current);
    if (!years.includes(year)) years.push(year);
    years.sort((a, b) => b - a);
    content = (
      <>
        <PageHeading
          title="A year in frames"
          description="The stories you discovered, the ones you returned to, and the memories that made this year yours. Revisit each chapter through the dates you actually watched."
        />
        <div className="yearPickerWrap">
          <YearPicker year={year} years={years} />
        </div>
        <YearReview review={buildYearReview(entries, year)} />
      </>
    );
  } else {
    const match = /^\/titles\/([^/]+)(\/edit)?$/.exec(path),
      entry = entries.find((entry) => entry.title.id === match?.[1]);
    content = entry ? (
      match?.[2] ? (
        <>
          <PageHeading
            title="Refine the details"
            description="A few careful details make a story easier to find. Update its metadata here; every viewing and personal memory stays with it."
          />
          <TitleEditor key={entry.title.id} title={entry.title} />
          <InstallmentManager
            key={location.searchParams.get("part")}
            entry={entry}
            initialPartId={location.searchParams.get("part")}
          />
        </>
      ) : (
        <TitleDetail
          entry={entry}
          selectedPartId={location.searchParams.get("part")}
        />
      )
    ) : (
      <div className="emptyMessage">
        <h1>This frame is missing.</h1>
        <SiteLink href="/library">Return to the collection</SiteLink>
      </div>
    );
  }
  return (
    <AppShell>
      <div key={path}>{content}</div>
    </AppShell>
  );
}
