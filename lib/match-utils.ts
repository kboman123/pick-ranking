export const KST_TIMEZONE = "Asia/Seoul";

/** KST 기준 현재 시각 (비교용) */
export function getNowKst(now: Date = new Date()): Date {
  return now;
}

/**
 * 경기 마감 여부 — scheduled_at <= 현재시각(KST)
 * DB scheduled_at(timestamptz)과 현재 순간을 비교합니다.
 */
export function isMatchClosed(
  scheduledAt: string,
  now: Date = getNowKst(),
): boolean {
  return new Date(scheduledAt).getTime() <= now.getTime();
}

export function isMatchOpen(
  scheduledAt: string,
  now: Date = getNowKst(),
): boolean {
  return !isMatchClosed(scheduledAt, now);
}
