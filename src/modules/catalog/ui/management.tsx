"use client";
import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { ArchiveEntry } from "../domain/archive-entry";
import { categoryEnglishLabel } from "../domain/title";
import { groupLibrary } from "../domain/library-query";
import { TitleEditor } from "./title-editor";
import { TitleRow } from "./title-row";
import styles from "./management.module.css";
export function Management({
  entries,
  initialAddOpen = false,
}: {
  entries: ArchiveEntry[];
  initialAddOpen?: boolean;
}) {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const groups = groupLibrary(entries, { search: query, sort: "name" });
  return (
    <div className={styles.management}>
      <details
        className={styles.add}
        open={addOpen}
        onToggle={(event) => setAddOpen(event.currentTarget.open)}
      >
        <summary>
          <Plus size={20} aria-hidden="true" />
          <span>
            Add to the collection
            <small>A new title, ready for its first memory.</small>
          </span>
          <span className={styles.addState}>
            {addOpen ? "Close" : "Open editor"}
          </span>
        </summary>
        <div id="add-entry" className={styles.addBody}>
          <TitleEditor
            cancelHref="/manage"
            onCancel={() => setAddOpen(false)}
          />
        </div>
      </details>
      <label className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <span className="srOnly">Search management list</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find a title, genre, country or language…"
        />
      </label>
      <p className={styles.overview}>
        All categories in one place. Open a story to manage its viewings, or
        edit its details directly.
      </p>
      <div>
        {groups.map((group) => (
          <section className={styles.group} key={group.id}>
            <div className="sectionHeading">
              <h2>{categoryEnglishLabel(group.id)}</h2>
              <span className="muted small">{group.entries.length} titles</span>
            </div>
            {group.entries.length ? (
              group.entries.map((entry) => (
                <TitleRow key={entry.title.id} entry={entry} editable />
              ))
            ) : (
              <p className={styles.empty}>
                No titles in this category
                {query ? " match your search" : " yet"}.{" "}
                <Link
                  href="/manage?add=1#add-entry"
                  onClick={() => setAddOpen(true)}
                >
                  Add a story
                </Link>
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
