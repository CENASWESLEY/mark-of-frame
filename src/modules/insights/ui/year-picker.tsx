"use client";
import { useRouter } from "next/navigation";
export function YearPicker({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();
  return (
    <label className="yearPicker">
      Viewing year
      <select
        value={year}
        onChange={(event) => router.push(`/year?year=${event.target.value}`)}
      >
        {years.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
