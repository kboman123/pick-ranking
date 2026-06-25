import {
  formatBaseballInningDetail,
  formatSyncedAt,
  shouldShowScore,
} from "@/lib/game-status";
import type { Match } from "@/lib/types";
import MatchStatusBadge from "@/components/MatchStatusBadge";

type MatchLiveMetaProps = {
  match: Match;
  showLastUpdate?: boolean;
  className?: string;
};

export default function MatchLiveMeta({
  match,
  showLastUpdate = true,
  className = "",
}: MatchLiveMetaProps) {
  const inningDetail = formatBaseballInningDetail(
    match.statusDetail,
    match.sport,
  );
  const showScore = shouldShowScore(match);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}
    >
      <MatchStatusBadge status={match.status} />

      {showScore ? (
        <span className="font-mono text-sm font-bold tabular-nums text-[#e8edf4] sm:text-base">
          {match.homeScore} - {match.awayScore}
        </span>
      ) : null}

      {inningDetail ? (
        <span className="text-xs font-medium text-[#8b9cb3]">{inningDetail}</span>
      ) : null}

      {showLastUpdate && match.syncedAt ? (
        <span className="text-[10px] text-[#8b9cb3] sm:text-xs">
          업데이트 {formatSyncedAt(match.syncedAt)}
        </span>
      ) : null}
    </div>
  );
}
