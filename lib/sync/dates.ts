const KST_TIMEZONE = "Asia/Seoul";

/** KST 기준 YYYY-MM-DD */
export function formatDateKst(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: KST_TIMEZONE });
}

export function getTodayKst(): string {
  return formatDateKst(new Date());
}

/** KST 날짜 하루의 UTC ISO bounds (Supabase timestamptz 필터용) */
export function getKstDayBounds(dateStr: string): { start: string; end: string } {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(`${dateStr}T23:59:59.999+09:00`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isScheduledOnKstDate(iso: string, dateStr: string): boolean {
  const { start, end } = getKstDayBounds(dateStr);
  const ts = new Date(iso).getTime();
  return ts >= new Date(start).getTime() && ts <= new Date(end).getTime();
}

export function getYesterdayKst(today = getTodayKst()): string {
  const d = new Date(`${today}T12:00:00+09:00`);
  d.setDate(d.getDate() - 1);
  return formatDateKst(d);
}
