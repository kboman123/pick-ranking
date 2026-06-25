import type { GameStatus } from "@/lib/types";
import {
  getStatusBadgeLabel,
  STATUS_BADGE_STYLES,
  type StatusBadgeLabel,
} from "@/lib/game-status";

type MatchStatusBadgeProps = {
  status?: GameStatus | null;
  className?: string;
};

export default function MatchStatusBadge({
  status,
  className = "",
}: MatchStatusBadgeProps) {
  const label = getStatusBadgeLabel(status);
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${STATUS_BADGE_STYLES[label]} ${className}`}
      aria-label={badgeAriaLabel(label)}
    >
      {label === "LIVE" ? (
        <>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
          LIVE
        </>
      ) : (
        label
      )}
    </span>
  );
}

function badgeAriaLabel(label: StatusBadgeLabel): string {
  switch (label) {
    case "LIVE":
      return "경기 진행 중";
    case "FINAL":
      return "경기 종료";
    case "CANCELLED":
      return "경기 취소";
    case "POSTPONED":
      return "경기 연기";
  }
}
