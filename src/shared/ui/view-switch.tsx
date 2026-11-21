"use client";
import { LayoutGrid, List } from "lucide-react";
export type CollectionView = "grid" | "rows";
export function ViewSwitch({
  value,
  onChange,
}: {
  value: CollectionView;
  onChange: (value: CollectionView) => void;
}) {
  return (
    <div className="viewSwitch" role="group" aria-label="Collection view">
      <button
        type="button"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        aria-label="Poster grid"
      >
        <LayoutGrid size={17} aria-hidden="true" />
        <span>Posters</span>
      </button>
      <button
        type="button"
        aria-pressed={value === "rows"}
        onClick={() => onChange("rows")}
        aria-label="Ranked list"
      >
        <List size={18} aria-hidden="true" />
        <span>List</span>
      </button>
    </div>
  );
}
