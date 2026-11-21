import { loadArchive } from "@/modules/catalog/server/queries";
import { HallOfFame } from "@/modules/rankings/ui/hall-of-fame";
import { ProgressList } from "@/modules/watching/ui/progress-list";

export const dynamic = "force-dynamic";
export default function HomePage() {
  const entries = loadArchive();
  return (
    <>
      <HallOfFame entries={entries} />
      <ProgressList entries={entries} />
    </>
  );
}
