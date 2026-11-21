import { BrowserArchive } from "./archive-store";
let archive: BrowserArchive | undefined;
export function getBrowserArchive() {
  archive ??= new BrowserArchive(window.localStorage);
  return archive;
}
export async function changeArchive<T>(
  operation: (archive: BrowserArchive) => T,
): Promise<T> {
  const run = () => operation(getBrowserArchive());
  return navigator.locks
    ? navigator.locks.request("mark-of-frame.archive", run)
    : run();
}
