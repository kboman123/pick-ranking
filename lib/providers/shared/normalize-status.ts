import type { ExternalGame, GameWinner, NormalizedStatus } from "@/lib/domain";
import type { LeagueCode } from "@/lib/domain/league";

type RawStatus = {
  long: string;
  short: string;
};

export function isRawGameFinished(status: RawStatus): boolean {
  const long = status.long.toLowerCase();
  const short = status.short.toUpperCase();
  return (
    long === "finished" ||
    short === "FT" ||
    short === "FIN" ||
    long.includes("finished")
  );
}

export function isRawGameLive(status: RawStatus): boolean {
  const long = status.long.toLowerCase();
  const short = status.short.toUpperCase();
  return (
    long.includes("progress") ||
    long.includes("live") ||
    short.startsWith("IN")
  );
}

export function normalizeRawStatus(status: RawStatus): NormalizedStatus {
  if (isRawGameFinished(status)) return "Finished";
  if (isRawGameLive(status)) return "Live";

  const long = status.long.toLowerCase();
  if (long.includes("postponed")) return "Postponed";
  if (long.includes("cancel")) return "Cancelled";
  if (long.includes("not started") || status.short === "NS") {
    return "Scheduled";
  }

  return "Scheduled";
}

export function resolveWinnerFromScores(
  homeScore: number | null,
  awayScore: number | null,
): GameWinner | null {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

function ordinalInning(n: string): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return n;
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

/** Live: 야구 이닝. 축구 확장 시 liveDetail에 경기시간(45' 등) 저장 */
export function extractLiveDetail(
  status: RawStatus,
  leagueCode: LeagueCode,
): string | null {
  const normalized = normalizeRawStatus(status);

  if (
    normalized === "Finished" ||
    normalized === "Cancelled" ||
    normalized === "Postponed"
  ) {
    return null;
  }

  const short = status.short.toUpperCase();
  if (short.startsWith("IN")) {
    const inning = short.replace(/^IN/, "");
    if (inning) {
      if (leagueCode === "MLB") return `${ordinalInning(inning)} Inning`;
      return `${inning}회`;
    }
  }

  const long = status.long;
  const inningMatch = long.match(/(\d+)(?:st|nd|rd|th)?\s+inning/i);
  if (inningMatch) {
    if (leagueCode === "MLB") {
      return `${ordinalInning(inningMatch[1])} Inning`;
    }
    return `${inningMatch[1]}회`;
  }

  if (isRawGameLive(status) && long) {
    return long;
  }

  return null;
}

export function externalGameToPickOutcome(
  game: ExternalGame,
): "home" | "away" | null {
  if (game.winner === "home" || game.winner === "away") {
    return game.winner;
  }
  return null;
}
