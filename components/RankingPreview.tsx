"use client";

import { useState } from "react";
import Link from "next/link";
import RankBadge from "@/components/RankBadge";
import RankingPeriodTabs, {
  type ActiveRankingPeriod,
} from "@/components/RankingPeriodTabs";
import { useRanking } from "@/hooks/useRanking";
import { RANKING_PERIOD_LABELS } from "@/lib/ranking-period";

function Top5MobileCard({
  member,
}: {
  member: {
    id: string;
    rank: number;
    name: string;
    totalGames: number;
    participated: number;
    hits: number;
    hitRate: number;
    rankingScore: number;
  };
}) {
  return (
    <li className="rounded-lg border border-[#1e2a3a] bg-[#0b0f14] p-2.5">
      <div className="flex items-center gap-2">
        <RankBadge rank={member.rank} />
        <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
          {member.name}
        </p>
        <p
          className={
            member.rank === 1
              ? "shrink-0 text-sm font-bold tabular-nums text-[#00d4aa]"
              : "shrink-0 text-sm font-bold tabular-nums text-[#e8edf4]"
          }
        >
          {member.rankingScore}%
        </p>
      </div>
      <p className="mt-1 text-[10px] leading-tight text-[#8b9cb3]">
        전체 {member.totalGames} · 참여 {member.participated} · 적중 {member.hits}{" "}
        · 적중률 {member.hitRate}%
      </p>
    </li>
  );
}

export default function RankingPreview() {
  const [period, setPeriod] = useState<ActiveRankingPeriod>("weekly");
  const { ranking, loaded } = useRanking(period);
  const top5 = ranking.slice(0, 5);

  if (!loaded) {
    return (
      <section className="rounded-xl border border-[#1e2a3a] bg-[#121820] px-3 py-8 text-center text-sm text-[#8b9cb3] sm:rounded-2xl sm:px-6 sm:py-12">
        랭킹 불러오는 중…
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#121820] sm:rounded-2xl">
      <div className="border-b border-[#1e2a3a] px-3 py-3 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">
              {RANKING_PERIOD_LABELS[period]} 랭킹 TOP 5
            </h2>
            <p className="text-[11px] text-[#8b9cb3] sm:mt-0.5 sm:text-sm">
              해당 기간 등록 경기 기준 랭킹 점수
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#00d4aa1a] px-2 py-0.5 text-[10px] font-medium text-[#00d4aa] sm:px-3 sm:py-1 sm:text-xs">
            LIVE
          </span>
        </div>
        <RankingPeriodTabs
          period={period}
          onChange={setPeriod}
          className="mt-3 max-w-xs"
        />
      </div>

      {top5.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-[#8b9cb3] sm:px-6 sm:py-12">
          해당 기간 랭킹 데이터가 없습니다.{" "}
          <Link href="/predict" className="text-[#00d4aa] hover:underline">
            예측하기
          </Link>
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-2 p-3 md:hidden">
            {top5.map((member) => (
              <Top5MobileCard key={member.id} member={member} />
            ))}
          </ul>

          <ul className="hidden divide-y divide-[#1e2a3a] md:block">
            {top5.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] lg:px-6"
              >
                <RankBadge rank={member.rank} />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00d4aa1a] text-sm font-bold text-[#00d4aa]">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="mt-1 text-sm text-[#8b9cb3]">
                    전체 {member.totalGames} · 참여 {member.participated} · 적중{" "}
                    {member.hits} · 실패 {member.misses} · 미참여{" "}
                    {member.nonParticipation}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={
                      member.rank === 1
                        ? "text-lg font-bold tabular-nums text-[#00d4aa]"
                        : "text-lg font-bold tabular-nums text-[#e8edf4]"
                    }
                  >
                    {member.rankingScore}%
                  </p>
                  <p className="text-xs text-[#8b9cb3]">
                    적중률 {member.hitRate}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
