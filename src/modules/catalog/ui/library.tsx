"use client";

import { useDeferredValue, useState, useRef } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { categories } from "../domain/title";
import { TitleCard } from "./title-card";
import { TitleRow } from "./title-row";
import { ViewSwitch, type CollectionView } from "@/shared/ui/view-switch";
import { watchStatuses } from "@/modules/watching/domain/watch-round";
import {
  rankThresholds,
  scoreInputSchema,
} from "@/modules/rankings/domain/score";
import {
  libraryFacets,
  librarySortSchema,
  queryLibrary,
  type LibrarySort,
} from "../domain/library-query";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import styles from "./library.module.css";

export function Library({ entries }: { entries: ArchiveEntry[] }) {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);
  const [category, setCategory] = useState("");
  const [genre, setGenre] = useState("");
  const [country, setCountry] = useState("");
  const [rank, setRank] = useState("");
  const [status, setStatus] = useState("");
  const [minimumScore, setMinimumScore] = useState("");
  const [minimumViewings, setMinimumViewings] = useState("");
  const [sort, setSort] = useState<LibrarySort>("score");
  const [hideDemo, setHideDemo] = useState(false);
  const [view, setView] = useState<CollectionView>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeFilters = () => {
    setFiltersOpen(false);
    toggleRef.current?.focus();
  };
  const { genres, countries } = libraryFacets(entries);
  const filtered = queryLibrary(entries, {
    search: query,
    category,
    genre,
    country,
    rank,
    status,
    minimumScore: scoreInputSchema.parse(minimumScore),
    minimumViewings: minimumViewings ? Number(minimumViewings) : null,
    hideDemo,
    sort,
  });
  return (
    <section className={styles.library} aria-label="The Collection">
      <div className={styles.resultBar}>
        <button
          ref={toggleRef}
          type="button"
          className="quietButton"
          aria-expanded={filtersOpen}
          aria-controls="collection-controls"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters &amp; sort
        </button>
        <p className={styles.result} role="status">
          พบ {filtered.length} เรื่อง จากทั้งหมด {entries.length} เรื่อง
        </p>
        <ViewSwitch value={view} onChange={setView} />
      </div>
      <div className={filtersOpen ? styles.layoutOpen : styles.layout}>
        {filtersOpen && (
          <aside
            id="collection-controls"
            className={styles.sidebar}
            aria-label="Collection controls"
          >
            <div className={styles.sidebarHeading}>
              <h2>Refine the collection</h2>
              <button
                type="button"
                className="quietButton"
                aria-label="Close collection controls"
                onClick={closeFilters}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.toolbar}>
              <label className={styles.search}>
                <Search size={19} aria-hidden="true" />
                <span className="srOnly">ค้นหาเรื่อง</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหาชื่อเรื่อง แนว ประเทศ หรือภาษา…"
                />
              </label>
              <label className={styles.sort}>
                เรียงตาม
                <select
                  value={sort}
                  onChange={(event) => {
                    const parsed = librarySortSchema.safeParse(
                      event.target.value,
                    );
                    if (parsed.success) setSort(parsed.data);
                  }}
                >
                  <option value="score">คะแนนสูงสุด</option>
                  <option value="viewings">ดูซ้ำมากที่สุด</option>
                  <option value="recent">เพิ่มล่าสุด</option>
                  <option value="name">ชื่อเรื่อง</option>
                </select>
              </label>
            </div>
            <div className={styles.filters}>
              <div className={styles.filterGrid}>
                <label>
                  หมวด
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">ทุกหมวด</option>
                    {categories
                      .filter((item) =>
                        entries.some(
                          (entry) => entry.title.category === item.id,
                        ),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  แนว
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    <option value="">ทุกแนว</option>
                    {genres.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  ประเทศ
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">ทุกประเทศ</option>
                    {countries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Rank
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                  >
                    <option value="">ทุก Rank</option>
                    {rankThresholds.map((item) => (
                      <option key={item.rank}>{item.rank}</option>
                    ))}
                  </select>
                </label>
                <label>
                  สถานะ
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">ทุกสถานะ</option>
                    {watchStatuses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  คะแนนขั้นต่ำ
                  <select
                    value={minimumScore}
                    onChange={(e) => setMinimumScore(e.target.value)}
                  >
                    <option value="">ไม่กำหนด</option>
                    {[5, 6, 7, 8, 9, 9.5].map((score) => (
                      <option key={score} value={score}>
                        {score}/10 ขึ้นไป
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  ดูจบอย่างน้อย
                  <select
                    value={minimumViewings}
                    onChange={(e) => setMinimumViewings(e.target.value)}
                  >
                    <option value="">ไม่กำหนด</option>
                    {[1, 2, 3, 5, 10].map((count) => (
                      <option key={count} value={count}>
                        {count} รอบ
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={hideDemo}
                  onChange={(e) => setHideDemo(e.target.checked)}
                />
                ซ่อนข้อมูลตัวอย่าง
              </label>
            </div>
            <button
              type="button"
              className="quietLink"
              onClick={() => {
                setSearch("");
                setCategory("");
                setGenre("");
                setCountry("");
                setRank("");
                setStatus("");
                setMinimumScore("");
                setMinimumViewings("");
                setHideDemo(false);
                setSort("score");
              }}
            >
              Reset filters
            </button>
          </aside>
        )}
        <div className={styles.results}>
          <div className={view === "grid" ? styles.grid : styles.rows}>
            {filtered.map((entry) =>
              view === "grid" ? (
                <div key={entry.title.id}>
                  <TitleCard entry={entry} />
                  <Link
                    className="quietLink small"
                    href={`/titles/${entry.title.id}/edit`}
                  >
                    Edit details
                  </Link>
                </div>
              ) : (
                <TitleRow key={entry.title.id} entry={entry} editable />
              ),
            )}
          </div>
          {!filtered.length && (
            <div className="emptyState">
              <h2>
                {entries.length
                  ? "No stories found."
                  : "Your collection begins here."}
              </h2>
              <p>
                {entries.length
                  ? "Try another title or a different combination of filters."
                  : "Add your first story, then leave a memory for the person you will become."}
              </p>
              {!entries.length && (
                <Link className="button" href="/titles/new">
                  เพิ่มเรื่องแรก
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
