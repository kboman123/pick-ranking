"use client";

import { useState } from "react";
import RankingPeriodTabs, {
  type ActiveRankingPeriod,
} from "@/components/RankingPeriodTabs";
import RankBadge from "@/components/RankBadge";
import { useRanking } from "@/hooks/useRanking";
import type { RankedMember } from "@/lib/ranking";
import {
  formatPeriodRange,
  getRankingPeriodBounds,
  RANKING_PERIOD_LABELS,
} from "@/lib/ranking-period";

const PERIOD_DESCRIPTIONS: Record<ActiveRankingPeriod, string> = {
  weekly: "매주 월요일 00:00(KST) 기준으로 해당 주 데이터만 집계합니다.",
  monthly: "매월 1일 00:00(KST) 기준으로 해당 월 데이터만 집계합니다.",
};

function StatCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "hit" | "miss" | "muted" | "accent";
}) {
  const valueClass =
    tone === "hit"
      ? "text-[#00d4aa]"
      : tone === "miss"
        ? "text-red-400"
        : tone === "muted"
          ? "text-[#8b9cb3]"
          : tone === "accent"
            ? "text-[#00d4aa]"
            : "text-[#e8edf4]";

  return (
    <div className="rounded-md border border-[#1e2a3a] bg-[#0b0f14] px-1 py-1 text-center sm:rounded-lg sm:px-2 sm:py-2">
      <p className="text-[9px] text-[#8b9cb3] sm:text-[10px]">{label}</p>
      <p className={`text-xs font-semibold tabular-nums sm:mt-0.5 sm:text-sm ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function RankingMobileCard({ member }: { member: RankedMember }) {
  return (
    <li className="rounded-lg border border-[#1e2a3a] bg-[#0b0f14] p-2.5">
      <div className="flex items-center gap-2">
        <RankBadge rank={member.rank} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{member.name}</p>
          <p className="text-[10px] leading-tight text-[#8b9cb3]">
            점수{" "}
            <span
              className={
                member.rank === 1
                  ? "font-bold text-[#00d4aa]"
                  : "font-bold text-[#e8edf4]"
              }
            >
              {member.rankingScore}%
            </span>
            {" · "}적중 {member.hitRate}%
          </p>
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-1">
        <StatCell label="전체" value={member.totalGames} />
        <StatCell label="참여" value={member.participated} />
        <StatCell label="적중" value={member.hits} tone="hit" />
        <StatCell label="실패" value={member.misses} tone="miss" />
        <StatCell label="미참여" value={member.nonParticipation} tone="muted" />
        <StatCell
          label="점수"
          value={`${member.rankingScore}%`}
          tone="accent"
        />
      </div>
    </li>
  );
}

function RankingRow({ member }: { member: RankedMember }) {
  return (
    <tr className="transition-colors hover:bg-white/[0.02]">
      <td className="px-4 py-4 lg:px-6">
        <RankBadge rank={member.rank} />
      </td>
      <td className="px-4 py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00d4aa1a] text-sm font-bold text-[#00d4aa]">
            {member.name.charAt(0)}
          </div>
          <span className="truncate font-medium">{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-right tabular-nums lg:px-6">
        {member.totalGames}
      </td>
      <td className="px-4 py-4 text-right tabular-nums lg:px-6">
        {member.participated}
      </td>
      <td className="px-4 py-4 text-right tabular-nums text-[#00d4aa] lg:px-6">
        {member.hits}
      </td>
      <td className="px-4 py-4 text-right tabular-nums text-red-400 lg:px-6">
        {member.misses}
      </td>
      <td className="px-4 py-4 text-right tabular-nums text-[#8b9cb3] lg:px-6">
        {member.nonParticipation}
      </td>
      <td className="px-4 py-4 text-right tabular-nums lg:px-6">
        {member.hitRate}%
      </td>
      <td
        className={
          member.rank === 1
            ? "px-4 py-4 text-right text-base font-bold tabular-nums text-[#00d4aa] lg:px-6"
            : "px-4 py-4 text-right text-base font-bold tabular-nums lg:px-6"
        }
      >
        {member.rankingScore}%
      </td>
    </tr>
  );
}

function RankingEmpty() {
  return (
    <div className="px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
      <p className="text-4xl">🏆</p>
      <p className="mt-4 font-medium">랭킹 데이터가 없습니다</p>
      <p className="mt-2 text-sm">해당 기간에 예측을 제출하면 표시됩니다.</p>
    </div>
  );
}

function RankingList({ ranking }: { ranking: RankedMember[] }) {
  if (ranking.length === 0) return <RankingEmpty />;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 p-3 md:hidden">
        {ranking.map((member) => (
          <RankingMobileCard key={member.id} member={member} />
        ))}
      </ul>

      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2a3a] text-left text-xs text-[#8b9cb3]">
              <th className="px-4 py-3 font-medium lg:px-6">순위</th>
              <th className="px-4 py-3 font-medium lg:px-6">닉네임</th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">
                전체 경기
              </th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">참여</th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">적중</th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">실패</th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">
                미참여
              </th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">
                적중률
              </th>
              <th className="px-4 py-3 text-right font-medium lg:px-6">
                랭킹 점수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a3a]">
            {ranking.map((member) => (
              <RankingRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RankingBoardContent({ period }: { period: ActiveRankingPeriod }) {
  const { ranking, loaded } = useRanking(period);
  const bounds = getRankingPeriodBounds(period);

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
        랭킹 불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <section className="rounded-xl border border-[#1e2a3a] bg-[#121820] px-3 py-3 sm:px-5 sm:py-4">
        <p className="text-xs leading-relaxed text-[#8b9cb3] sm:text-sm">
          {PERIOD_DESCRIPTIONS[period]}
        </p>
        <p className="mt-1.5 break-words text-[10px] text-[#8b9cb3] sm:mt-2 sm:text-xs">
          집계 기간: {formatPeriodRange(bounds)}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#8b9cb3] sm:mt-2 sm:text-xs">
          랭킹 점수 = 적중 ÷ 전체 경기 × 100 · 적중률 = 적중 ÷ (적중+실패) ×
          100
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#121820] sm:rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-[#1e2a3a] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">
              {RANKING_PERIOD_LABELS[period]} 랭킹
            </h2>
            <p className="text-xs text-[#8b9cb3] sm:mt-0.5 sm:text-sm">
              점수 · 적중 · 참여 순
            </p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-[#00d4aa1a] px-3 py-1 text-xs font-medium text-[#00d4aa]">
            {ranking.length}명
          </span>
        </div>

        <RankingList ranking={ranking} />
      </section>
    </div>
  );
}

export default function RankingBoard() {
  const [period, setPeriod] = useState<ActiveRankingPeriod>("weekly");

  return (
    <div className="space-y-3 sm:space-y-6">
      <RankingPeriodTabs period={period} onChange={setPeriod} />

      <RankingBoardContent period={period} />
    </div>
  );
}
