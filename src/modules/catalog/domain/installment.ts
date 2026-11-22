import { z } from "zod";
import { titleInputSchema } from "./title";
export const installmentInputSchema = z.object({
  titleId: z.string().uuid(),
  name: titleInputSchema.shape.name,
  position: z.coerce.number().int().min(1).max(1000),
  releaseYear: titleInputSchema.shape.releaseYear,
  coverUrl: titleInputSchema.shape.coverUrl,
  backdropUrl: titleInputSchema.shape.backdropUrl,
  synopsis: titleInputSchema.shape.synopsis,
  totalEpisodes: titleInputSchema.shape.totalEpisodes,
});
export type InstallmentInput = z.output<typeof installmentInputSchema>;
export type Installment = InstallmentInput & { id: string };
