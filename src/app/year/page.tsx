import type { Metadata } from "next";
import { loadArchive } from "@/modules/catalog/server/queries";
import {
  availableReviewYears,
  buildYearReview,
} from "@/modules/insights/domain/year-review";
import { YearReview } from "@/modules/insights/ui/year-review";
import { YearPicker } from "@/modules/insights/ui/year-picker";
import { currentBangkokYear } from "@/shared/lib/current-year";
import { PageHeading } from "@/shared/ui/page-heading";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Year in Review" };
export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const requested = (await searchParams).year,
    current = currentBangkokYear();
  const year =
    requested && /^\d{4}$/.test(requested) && Number(requested) > 0
      ? Number(requested)
      : current;
  const entries = loadArchive(),
    years = availableReviewYears(entries, current);
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => b - a);
  return (
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
}
