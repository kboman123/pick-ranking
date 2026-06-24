export type RankingPeriod = "overall" | "weekly" | "monthly";

export type PeriodBounds = {
  start: Date;
  end: Date;
};

export const RANKING_PERIOD_LABELS: Record<RankingPeriod, string> = {
  overall: "전체",
  weekly: "주간",
  monthly: "월간",
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function getKstCalendarParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

export function kstMidnight(year: number, month: number, day: number): Date {
  return new Date(`${year}-${pad2(month)}-${pad2(day)}T00:00:00+09:00`);
}

export function addDaysKst(
  year: number,
  month: number,
  day: number,
  days: number,
) {
  const next = new Date(
    kstMidnight(year, month, day).getTime() + days * 86_400_000,
  );
  const parts = getKstCalendarParts(next);
  return { year: parts.year, month: parts.month, day: parts.day };
}

/** overall=null(필터 없음), weekly=월요일 00:00 KST, monthly=1일 00:00 KST */
export function getRankingPeriodBounds(
  period: RankingPeriod,
  now = new Date(),
): PeriodBounds | null {
  if (period === "overall") return null;

  if (period === "weekly") {
    const { year, month, day, weekday } = getKstCalendarParts(now);
    const daysSinceMonday = (weekday + 6) % 7;
    const monday = addDaysKst(year, month, day, -daysSinceMonday);
    const nextMonday = addDaysKst(monday.year, monday.month, monday.day, 7);
    return {
      start: kstMidnight(monday.year, monday.month, monday.day),
      end: kstMidnight(nextMonday.year, nextMonday.month, nextMonday.day),
    };
  }

  const { year, month } = getKstCalendarParts(now);
  const nextMonth =
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return {
    start: kstMidnight(year, month, 1),
    end: kstMidnight(nextMonth.year, nextMonth.month, 1),
  };
}

export function isInPeriod(
  iso: string,
  bounds: PeriodBounds | null,
): boolean {
  if (!bounds) return true;
  const time = new Date(iso).getTime();
  return time >= bounds.start.getTime() && time < bounds.end.getTime();
}

export function formatPeriodRange(bounds: PeriodBounds | null): string {
  if (!bounds) return "서비스 시작 이후 누적";

  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const endLabel = new Date(bounds.end.getTime() - 1);
  return `${fmt.format(bounds.start)} ~ ${fmt.format(endLabel)} (KST)`;
}
