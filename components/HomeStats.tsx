"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { useRanking } from "@/hooks/useRanking";
import { getParticipantCount } from "@/lib/nickname-store";
import { getTodayMatchCount } from "@/lib/match-store";
import { NICKNAME_CHANGED_EVENT } from "@/lib/events";

type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  accent?: boolean;
};

function StatCard({ label, value, unit, icon, accent = false }: StatCardProps) {
  return (
    <div
      className={
        accent
          ? "relative overflow-hidden rounded-xl border border-[#00d4aa66] bg-gradient-to-br from-[#00d4aa1a] to-[#121820] p-3 sm:rounded-2xl sm:p-6"
          : "relative overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#121820] p-3 sm:rounded-2xl sm:p-6"
      }
    >
      {accent ? (
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#00d4aa1a] blur-2xl" />
      ) : null}
      <div className="mb-2 flex items-center justify-between sm:mb-4">
        <span className="text-xs font-medium text-[#8b9cb3] sm:text-sm">{label}</span>
        <span className="text-base text-[#00d4aa] sm:text-xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="truncate text-xl font-bold tracking-tight text-[#e8edf4] sm:text-3xl">
          {value}
        </span>
        {unit ? (
          <span className="shrink-0 text-xs font-medium text-[#8b9cb3] sm:text-sm">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function HomeStats() {
  const { loaded: matchesLoaded } = useMatches();
  const { ranking, loaded: rankingLoaded } = useRanking("weekly");
  const [participants, setParticipants] = useState(0);
  const [todayMatches, setTodayMatches] = useState(0);

  useEffect(() => {
    if (!matchesLoaded) return;

    async function update() {
      setTodayMatches(await getTodayMatchCount());
      setParticipants(await getParticipantCount());
    }

    void update();
    const handler = () => void update();
    window.addEventListener(NICKNAME_CHANGED_EVENT, handler);
    return () => window.removeEventListener(NICKNAME_CHANGED_EVENT, handler);
  }, [matchesLoaded, ranking]);

  const topAnalyst = ranking[0];
  const ready = matchesLoaded && rankingLoaded;

  if (!ready) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-2 sm:mb-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[#1e2a3a] bg-[#121820] sm:h-32 sm:rounded-2xl"
          />
        ))}
      </div>
    );
  }

  return (
    <section className="mb-6 grid grid-cols-2 gap-2 sm:mb-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="오늘 경기"
        value={todayMatches}
        unit="경기"
        icon={<span className="text-xl">⚾</span>}
      />
      <StatCard
        label="참여 회원"
        value={participants}
        unit="명"
        icon={<span className="text-xl">👥</span>}
      />
      <div className="col-span-2 lg:col-span-1">
        <StatCard
          label="주간 1위"
          value={topAnalyst?.name ?? "-"}
          unit={topAnalyst ? `${topAnalyst.rankingScore}%` : undefined}
          accent
          icon={<span className="text-xl">🏆</span>}
        />
      </div>
    </section>
  );
}
