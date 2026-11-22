import type { Title } from "./title";
import type { WatchRound } from "@/modules/watching/domain/watch-round";
import type { Installment } from "./installment";

export type ArchiveEntry = {
  title: Title;
  rounds: WatchRound[];
  installments?: Installment[];
};
