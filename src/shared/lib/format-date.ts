export function formatDate(value: string | null, locale = "th-TH"): string {
  if (!value) return "ไม่ได้ระบุวันที่";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: "gregory",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value));
}
