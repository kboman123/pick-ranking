/** 경기 시작 시간이 지났는지 판별 (시작 시각 = 예측 마감) */
export function isMatchClosed(
  scheduledAt: string,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= new Date(scheduledAt).getTime();
}

export function isMatchOpen(
  scheduledAt: string,
  now: Date = new Date(),
): boolean {
  return !isMatchClosed(scheduledAt, now);
}
