import type { Title } from "./title";
import type { WatchRound } from "@/modules/watching/domain/watch-round";

export type ArchiveEntry = { title: Title; rounds: WatchRound[] };
