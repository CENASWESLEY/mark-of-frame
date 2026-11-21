import "server-only";
import { getDatabase } from "@/infrastructure/database/server";
import { readArchive, readTitle } from "./title-store";

export const loadArchive = () => readArchive(getDatabase());
export const loadTitle = (id: string) => readTitle(getDatabase(), id);
