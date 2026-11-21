export function currentBangkokYear(): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Asia/Bangkok",
    }).format(new Date()),
  );
}
