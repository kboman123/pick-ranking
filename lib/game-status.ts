import type { GameStatus, Match, Sport } from "./types";

export type NormalizedGameStatus =
  | "Scheduled"
  | "Live"
  | "Finished"
  | "Postponed"
  | "Cancelled";

export type StatusBadgeLabel = "LIVE" | "FINAL" | "CANCELLED" | "POSTPONED";

const STATUS_ALIASES: Record<string, NormalizedGameStatus> = {
  scheduled: "Scheduled",
  "not started": "Scheduled",
  ns: "Scheduled",
  live: "Live",
  "in progress": "Live",
  finished: "Finished",
  ft: "Finished",
  fin: "Finished",
  final: "Finished",
  postponed: "Postponed",
  ppd: "Postponed",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  cn: "Cancelled",
};

export function normalizeGameStatus(
  status: GameStatus | null | undefined,
): NormalizedGameStatus {
  if (!status) return "Scheduled";

  const key = status.trim().toLowerCase();
  return STATUS_ALIASES[key] ?? (status as NormalizedGameStatus);
}

export function getStatusBadgeLabel(
  status: GameStatus | null | undefined,
): StatusBadgeLabel | null {
  switch (normalizeGameStatus(status)) {
    case "Live":
      return "LIVE";
    case "Finished":
      return "FINAL";
    case "Cancelled":
      return "CANCELLED";
    case "Postponed":
      return "POSTPONED";
    default:
      return null;
  }
}

export function shouldShowScore(match: Pick<Match, "status" | "homeScore" | "awayScore">): boolean {
  const status = normalizeGameStatus(match.status);
  if (status === "Live" || status === "Finished") {
    return match.homeScore != null && match.awayScore != null;
  }
  return false;
}

/** KST 기준 마지막 동기화 시각 */
export function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

/** 야구 이닝 표시 (축구 등 다른 종목은 statusDetail에 경기시간 저장 가능) */
export function formatBaseballInningDetail(
  raw: string | null | undefined,
  sport: Sport,
): string | null {
  if (!raw?.trim()) return null;
  return raw.trim();
}

export const STATUS_BADGE_STYLES: Record<
  StatusBadgeLabel,
  string
> = {
  LIVE: "border-red-500/50 bg-red-500/15 text-red-400 animate-pulse",
  FINAL: "border-[#8b9cb366] bg-[#8b9cb31a] text-[#8b9cb3]",
  CANCELLED: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  POSTPONED: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
};
