"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useMatches } from "@/hooks/useMatches";
import { addMatch, deleteMatch, updateMatch } from "@/lib/match-store";
import MatchLiveMeta from "@/components/MatchLiveMeta";
import { formatSyncedAt } from "@/lib/game-status";
import type { Match, Sport } from "@/lib/types";
import { SPORTS } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-[#1e2a3a] bg-[#0b0f14] px-4 py-3 text-[#e8edf4] outline-none transition-colors focus:border-[#00d4aa66] focus:ring-1 focus:ring-[#00d4aa33]";

const labelClass = "mb-2 block text-sm font-medium text-[#8b9cb3]";

function formatMatchDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SportBadge({ sport }: { sport: Sport }) {
  const colors: Record<Sport, string> = {
    KBO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    MLB: "bg-red-500/20 text-red-400 border-red-500/30",
    NPB: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${colors[sport]}`}
    >
      {sport}
    </span>
  );
}

function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
        <p className="text-4xl">⚾</p>
        <p className="mt-4 font-medium">등록된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#1e2a3a]">
      {matches.map((match) => (
        <li
          key={match.id}
          className="px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-6"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SportBadge sport={match.sport} />
            <span className="text-xs text-[#8b9cb3]">
              {formatMatchDate(match.scheduledAt)}
            </span>
          </div>
          <MatchLiveMeta match={match} className="mb-2" />
          <p className="break-words text-base font-semibold sm:text-lg">
            {match.homeTeam}
            <span className="mx-2 text-sm font-normal text-[#8b9cb3]">vs</span>
            {match.awayTeam}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function MatchManager() {
  const { isAdmin } = useAdmin();
  const { matches, refresh, lastLiveUpdateAt } = useMatches();
  const [sport, setSport] = useState<Sport>("KBO");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setSport("KBO");
    setHomeTeam("");
    setAwayTeam("");
    setScheduledAt("");
    setEditingId(null);
  }

  function startEdit(match: Match) {
    setEditingId(match.id);
    setSport(match.sport);
    setHomeTeam(match.homeTeam);
    setAwayTeam(match.awayTeam);
    setScheduledAt(toDatetimeLocal(match.scheduledAt));
    setError("");
    setMessage("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!homeTeam.trim() || !awayTeam.trim() || !scheduledAt) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    if (homeTeam.trim() === awayTeam.trim()) {
      setError("홈팀과 원정팀은 서로 달라야 합니다.");
      return;
    }

    const input = {
      sport,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateMatch(editingId, input);
        if (!updated) {
          setError("경기 수정에 실패했습니다.");
          return;
        }
        setMessage(`${updated.homeTeam} vs ${updated.awayTeam} 경기가 수정되었습니다.`);
      } else {
        const created = await addMatch(input);
        setMessage(
          `${created.homeTeam} vs ${created.awayTeam} 경기가 저장되었습니다.`,
        );
      }

      await refresh();
      resetForm();
    } catch {
      setError("경기 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 경기를 삭제할까요?")) return;
    try {
      if (await deleteMatch(id)) {
        if (editingId === id) resetForm();
        await refresh();
        setMessage("경기가 삭제되었습니다.");
        setError("");
      }
    } catch {
      setError("경기 삭제에 실패했습니다.");
    }
  }

  if (!isAdmin) {
    return (
      <section className="rounded-2xl border border-[#1e2a3a] bg-[#121820]">
        <div className="border-b border-[#1e2a3a] px-4 py-5 sm:px-6">
          <h2 className="text-lg font-semibold">경기 일정</h2>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            총 {matches.length}경기 · 조회 전용
            {lastLiveUpdateAt ? (
              <> · 실시간 갱신 {formatSyncedAt(lastLiveUpdateAt)}</>
            ) : null}
          </p>
        </div>
        <MatchList matches={matches} />
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#1e2a3a] bg-[#121820] p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {editingId ? "경기 수정" : "경기 등록"}
            </h2>
            <p className="mt-1 text-sm text-[#8b9cb3]">
              오늘 경기는 Cron 동기화로 자동 등록됩니다. 아래는 예외 상황용
              수동 등록입니다.
            </p>
          </div>
          <span className="rounded-full bg-[#00d4aa1a] px-3 py-1 text-xs font-medium text-[#00d4aa]">
            ADMIN
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="sport" className={labelClass}>
              종목
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value as Sport)}
              className={inputClass}
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="homeTeam" className={labelClass}>
              홈팀
            </label>
            <input
              id="homeTeam"
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              placeholder="예: LG 트윈스"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="awayTeam" className={labelClass}>
              원정팀
            </label>
            <input
              id="awayTeam"
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              placeholder="예: 두산 베어스"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="scheduledAt" className={labelClass}>
              경기시간
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-4 py-3 text-sm text-[#00d4aa]">
              {message}
            </p>
          ) : null}

          <div className="flex gap-3">
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-xl border border-[#1e2a3a] py-3 font-semibold text-[#8b9cb3] transition-colors hover:text-[#e8edf4]"
              >
                취소
              </button>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#00d4aa] py-3 font-semibold text-[#0b0f14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "저장 중…" : editingId ? "수정 저장" : "저장"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#1e2a3a] bg-[#121820]">
        <div className="border-b border-[#1e2a3a] px-4 py-5 sm:px-6">
          <h2 className="text-lg font-semibold">등록된 경기</h2>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            총 {matches.length}경기 · 수정 · 삭제 가능
            {lastLiveUpdateAt ? (
              <> · 실시간 갱신 {formatSyncedAt(lastLiveUpdateAt)}</>
            ) : null}
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
            <p className="text-4xl">⚾</p>
            <p className="mt-4 font-medium">등록된 경기가 없습니다</p>
            <p className="mt-1 text-sm">왼쪽 폼에서 첫 경기를 등록해 보세요.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1e2a3a]">
            {matches.map((match) => (
              <li
                key={match.id}
                className="px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-6"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SportBadge sport={match.sport} />
                  <span className="text-xs text-[#8b9cb3]">
                    {formatMatchDate(match.scheduledAt)}
                  </span>
                </div>
                <MatchLiveMeta match={match} className="mb-2" />
                <p className="break-words text-base font-semibold sm:text-lg">
                  {match.homeTeam}
                  <span className="mx-2 text-sm font-normal text-[#8b9cb3]">
                    vs
                  </span>
                  {match.awayTeam}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(match)}
                    className="rounded-lg border border-[#1e2a3a] px-3 py-1.5 text-xs text-[#8b9cb3] transition-colors hover:border-[#00d4aa33] hover:text-[#00d4aa]"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(match.id)}
                    className="rounded-lg border border-[#1e2a3a] px-3 py-1.5 text-xs text-[#8b9cb3] transition-colors hover:border-red-500/30 hover:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
