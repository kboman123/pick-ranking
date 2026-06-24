"use client";

import {
  RANKING_PERIOD_LABELS,
  type RankingPeriod,
} from "@/lib/ranking-period";

export type ActiveRankingPeriod = Extract<RankingPeriod, "weekly" | "monthly">;

export const ACTIVE_RANKING_PERIODS: ActiveRankingPeriod[] = [
  "weekly",
  "monthly",
];

type RankingPeriodTabsProps = {
  period: ActiveRankingPeriod;
  onChange: (period: ActiveRankingPeriod) => void;
  className?: string;
};

export default function RankingPeriodTabs({
  period,
  onChange,
  className = "",
}: RankingPeriodTabsProps) {
  return (
    <div className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${className}`}>
      {ACTIVE_RANKING_PERIODS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={
            period === tab
              ? "rounded-lg bg-[#00d4aa] px-2 py-2 text-xs font-semibold text-[#0b0f14] sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
              : "rounded-lg border border-[#1e2a3a] bg-[#121820] px-2 py-2 text-xs font-medium text-[#8b9cb3] transition-colors hover:border-[#00d4aa33] hover:text-[#e8edf4] sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm"
          }
        >
          {RANKING_PERIOD_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
