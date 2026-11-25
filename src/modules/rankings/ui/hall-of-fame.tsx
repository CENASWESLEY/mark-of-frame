"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  Pause,
  Play,
  Star,
  Expand,
} from "lucide-react";
import {
  categories,
  categoryEnglishLabel,
  type Category,
} from "@/modules/catalog/domain/title";
import { latestRound } from "@/modules/watching/domain/watch-round";
import { TitleCard } from "@/modules/catalog/ui/title-card";
import { TitleRow } from "@/modules/catalog/ui/title-row";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import { ViewSwitch, type CollectionView } from "@/shared/ui/view-switch";
import { formatDate } from "@/shared/lib/format-date";
import { rankEntries } from "../domain/rankings";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { formatScore } from "../domain/score";
import { useFeaturedCarousel } from "./use-featured-carousel";
import { storyViewings } from "@/modules/catalog/domain/series";
import styles from "./hall-of-fame.module.css";
import { TopTenDialog } from "./top-ten-dialog";

export function HallOfFame({ entries }: { entries: ArchiveEntry[] }) {
  const heroRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const hero = heroRef.current,
      header = document.querySelector("header");
    if (!hero || !header) return;
    // Header wrapping changes with viewport width and fonts; reserve its actual height.
    const measure = () =>
      hero.style.setProperty(
        "--showcase-header",
        `${header.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const visibleCategories = categories.filter((item) =>
    entries.some((entry) => entry.title.category === item.id),
  );
  const [category, setCategory] = useState<Category>(
    () =>
      visibleCategories.find((item) => rankEntries(entries, item.id).length)
        ?.id ??
      visibleCategories[0]?.id ??
      "film",
  );
  const [view, setView] = useState<CollectionView>("grid");
  const [topTenOpen, setTopTenOpen] = useState(false);
  const ranked = useMemo(
    () => rankEntries(entries, category),
    [entries, category],
  );
  const ids = useMemo(
    () => ranked.slice(0, 10).map((entry) => entry.title.id),
    [ranked],
  );
  const carousel = useFeaturedCarousel(ids, topTenOpen);
  const selected =
    ranked.find((entry) => entry.title.id === carousel.currentId) ?? ranked[0];
  const previous = entries.find(
    (entry) => entry.title.id === carousel.previousId,
  );
  const latest = selected ? latestRound(selected.rounds) : null;
  function changeCategory(id: Category) {
    setCategory(id);
    carousel.reset();
  }
  const metadata = selected
    ? [
        selected.title.releaseYear,
        selected.title.runtimeMinutes
          ? `${selected.title.runtimeMinutes} min`
          : null,
        selected.title.totalEpisodes
          ? `${selected.title.totalEpisodes} episodes`
          : null,
        ...selected.title.genres,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  return (
    <div className={styles.hall}>
      <section
        ref={heroRef}
        className={styles.hero}
        aria-label="Featured top ten slideshow"
        onFocusCapture={() => carousel.setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            carousel.setFocused(false);
        }}
      >
        {previous && (
          <div
            key={`previous-${selected?.title.id}`}
            className={`${styles.scene} ${styles.previousScene}`}
            aria-hidden="true"
          >
            <Artwork
              src={previous.title.backdropUrl || previous.title.coverUrl}
              title={previous.title.name}
              backdrop
              eager
            />
          </div>
        )}
        {selected && (
          <div
            className={styles.scene}
            key={selected.title.id}
            aria-hidden="true"
          >
            <Artwork
              src={selected.title.backdropUrl || selected.title.coverUrl}
              title={selected.title.name}
              backdrop
              eager
            />
          </div>
        )}
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.mist} aria-hidden="true" />
        <div
          className={styles.heroNavigation}
          role="group"
          aria-label="Featured category"
        >
          {visibleCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => changeCategory(item.id)}
            >
              {categoryEnglishLabel(item.id)}
            </button>
          ))}
        </div>
        <div className={styles.showcase}>
          {selected ? (
            <>
              <div className={styles.heroContent}>
                <p className={styles.place}>
                  <Crown size={17} aria-hidden="true" />
                  No. {String(selected.position).padStart(2, "0")} in{" "}
                  {categoryEnglishLabel(category)}
                  {selected.title.isDemo && (
                    <span className="sampleLabel">Sample collection</span>
                  )}
                </p>
                <h2 title={selected.title.name}>{selected.title.name}</h2>
                {metadata && <p className={styles.metadata}>{metadata}</p>}
                <div className={styles.verdict}>
                  <RankBadge rank={selected.rank} size="large" />
                  <span className={styles.score}>
                    {formatScore(selected.score)}
                    <small>/ 10</small>
                  </span>
                  <span className={styles.rewatch}>
                    <Star size={15} aria-hidden="true" />
                    {storyViewings(selected)} viewings
                  </span>
                </div>
                <p className={styles.synopsis}>
                  {selected.title.synopsis || "Synopsis coming soon."}
                </p>
                <div className={styles.heroActions}>
                  <Link
                    href={`/titles/${selected.title.id}`}
                    className="button"
                  >
                    <BookOpen size={16} aria-hidden="true" />
                    Open my memory
                  </Link>
                  <span>
                    {latest?.finishedOn || latest?.startedOn
                      ? formatDate(latest.finishedOn ?? latest.startedOn)
                      : "Viewing date not recorded"}
                  </span>
                </div>
                <div
                  className={styles.podium}
                  aria-label="Top three in this category"
                >
                  {ranked.length > 0 && (
                    <h3 className={styles.podiumHeading}>TOP 3</h3>
                  )}
                  {ranked.slice(0, 3).map((entry, index) => (
                    <button
                      type="button"
                      key={entry.title.id}
                      onClick={() => carousel.select(entry.title.id)}
                      aria-pressed={entry.title.id === selected?.title.id}
                      aria-label={`Feature number ${index + 1}: ${entry.title.name}`}
                    >
                      <span className={styles.podiumNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.podiumCover}>
                        <Artwork
                          src={entry.title.coverUrl}
                          title={entry.title.name}
                        />
                      </span>
                      <span className={styles.podiumText}>
                        <strong>{entry.title.name}</strong>
                        <span>{formatScore(entry.score)} / 10</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={styles.featuredPoster}
                key={`cover-${selected.title.id}`}
              >
                <Artwork
                  src={selected.title.coverUrl}
                  title={selected.title.name}
                  eager
                />
              </div>
            </>
          ) : (
            <div className={`${styles.heroContent} ${styles.emptyContent}`}>
              <Crown size={40} className="gold" aria-hidden="true" />
              <h2>The hall awaits.</h2>
              <p className={styles.metadata}>
                Every great collection begins with a story worth remembering.
                Add a title and score your latest viewing to give it a place
                here.
              </p>
              <Link href="/manage?add=1#add-entry" className="button">
                Add a story
              </Link>
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <button
            onClick={() => carousel.step(-1)}
            disabled={ids.length < 2}
            aria-label="Previous featured title"
          >
            <ArrowLeft size={17} />
          </button>
          <span>
            {String(
              ids.length
                ? Math.max(1, ids.indexOf(carousel.currentId ?? "") + 1)
                : 0,
            ).padStart(2, "0")}{" "}
            / {String(ids.length).padStart(2, "0")}
          </span>
          <button
            onClick={() => carousel.step(1)}
            disabled={ids.length < 2}
            aria-label="Next featured title"
          >
            <ArrowRight size={17} />
          </button>
          <button
            onClick={carousel.togglePlayback}
            disabled={carousel.reducedMotion || ids.length < 2}
            aria-label={
              carousel.reducedMotion
                ? "Slideshow disabled for reduced motion"
                : carousel.paused
                  ? "Play slideshow"
                  : "Pause slideshow"
            }
            aria-pressed={carousel.paused || carousel.reducedMotion}
          >
            {carousel.paused || carousel.reducedMotion ? (
              <Play size={16} />
            ) : (
              <Pause size={16} />
            )}
          </button>
        </div>
      </section>
      <section className={styles.dedication} aria-labelledby="hall-heading">
        <div className={styles.ornament} aria-hidden="true">
          <span />
          <Crown size={23} />
          <span />
        </div>
        <h1 id="hall-heading">Hall of Frame</h1>
        <p>
          A monument to the stories that became a part of you.
          <br />
          Not simply watched. Remembered, revisited, and held above the rest.
        </p>
      </section>
      <section className={styles.collection} aria-label="Top ten by category">
        <div className="sectionHeading">
          <div>
            <h2>The All-Time Ten</h2>
            <p>
              Ten places. A lifetime of stories. Ranked by your most recent
              viewing, with every category standing on its own.
            </p>
          </div>
          <div className={styles.collectionActions}>
            {ranked.length > 0 && (
              <button
                className="button"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setTopTenOpen(true)}
              >
                <Expand size={17} aria-hidden="true" />
                View full Top 10
              </button>
            )}
            <ViewSwitch value={view} onChange={setView} />
          </div>
        </div>
        <div
          className={styles.categories}
          role="group"
          aria-label="Ranking category"
        >
          {visibleCategories.map((item) => (
            <button
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => changeCategory(item.id)}
            >
              {categoryEnglishLabel(item.id)}
              <span>{rankEntries(entries, item.id).length}</span>
            </button>
          ))}
        </div>
        <div className={view === "grid" ? styles.grid : styles.rows}>
          {ranked
            .slice(0, 10)
            .map((entry) =>
              view === "grid" ? (
                <TitleCard
                  key={entry.title.id}
                  entry={entry}
                  position={entry.position}
                />
              ) : (
                <TitleRow
                  key={entry.title.id}
                  entry={entry}
                  position={entry.position}
                />
              ),
            )}
        </div>
        {!ranked.length && (
          <p className="emptyMessage">
            No rated viewings in this category yet. Its first place is waiting
            for you.
          </p>
        )}
      </section>
      <TopTenDialog
        open={topTenOpen}
        onClose={() => setTopTenOpen(false)}
        categoryName={categoryEnglishLabel(category)}
        entries={ranked.slice(0, 10)}
      />
    </div>
  );
}
