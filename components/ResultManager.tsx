"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useMatches } from "@/hooks/useMatches";
import { useNickname } from "@/hooks/useNickname";
import { buildResultMap, saveGameResults } from "@/lib/match-store";
import { fetchSavedPredictions } from "@/lib/prediction-store";
import {
  outcomeLabel,
  summarizePredictions,
  type EvaluationStatus,
} from "@/lib/scoring";
import type { MatchOutcome, Sport } from "@/lib/types";

function formatMatchDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatSavedAt(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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

function StatusBadge({ status }: { status: EvaluationStatus }) {
  const styles: Record<EvaluationStatus, string> = {
    hit: "border-[#00d4aa33] bg-[#00d4aa1a] text-[#00d4aa]",
    miss: "border-red-500/30 bg-red-500/10 text-red-400",
    pending: "border-[#1e2a3a] bg-[#1e2a3a80] text-[#8b9cb3]",
    no_pick: "border-[#1e2a3a] text-[#8b9cb3]",
  };
  const labels: Record<EvaluationStatus, string> = {
    hit: "적중",
    miss: "미적중",
    pending: "결과 대기",
    no_pick: "예측 없음",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

type OutcomeButtonProps = {
  label: string;
  subLabel: string;
  selected: boolean;
  onClick: () => void;
};

function OutcomeButton({
  label,
  subLabel,
  selected,
  onClick,
}: OutcomeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "min-w-0 flex-1 rounded-lg border border-[#00d4aa66] bg-[#00d4aa1a] px-2 py-2 text-left transition-all sm:rounded-xl sm:px-4 sm:py-3 sm:shadow-[0_0_16px_rgba(0,212,170,0.15)]"
          : "min-w-0 flex-1 rounded-lg border border-[#1e2a3a] bg-[#0b0f14] px-2 py-2 text-left transition-all hover:border-[#00d4aa33] sm:rounded-xl sm:px-4 sm:py-3"
      }
    >
      <span
        className={
          selected
            ? "block truncate text-xs font-semibold text-[#00d4aa] sm:text-sm"
            : "block truncate text-xs font-semibold text-[#e8edf4] sm:text-sm"
        }
      >
        {label}
      </span>
      <span className="mt-0.5 block text-[10px] text-[#8b9cb3] sm:text-xs">{subLabel}</span>
    </button>
  );
}

function ResultDisplay({
  label,
  subLabel,
  winner,
}: {
  label: string;
  subLabel: string;
  winner: boolean;
}) {
  return (
    <div
      className={
        winner
          ? "min-w-0 flex-1 rounded-xl border border-[#00d4aa66] bg-[#00d4aa1a] px-3 py-3 sm:px-4"
          : "min-w-0 flex-1 rounded-xl border border-[#1e2a3a] bg-[#0b0f14] px-3 py-3 opacity-60 sm:px-4"
      }
    >
      <span
        className={
          winner
            ? "block truncate text-sm font-semibold text-[#00d4aa]"
            : "block truncate text-sm font-semibold text-[#8b9cb3]"
        }
      >
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-[#8b9cb3]">
        {winner ? "🏆 " : ""}
        {subLabel}
      </span>
    </div>
  );
}

export default function ResultManager() {
  const { isAdmin } = useAdmin();
  const { matches, loaded, refresh } = useMatches();
  const { userId } = useNickname();
  const [results, setResults] = useState<Record<string, MatchOutcome>>({});
  const [pickMap, setPickMap] = useState<Record<string, MatchOutcome>>({});
  const [savedAt, setSavedAt] = useState("");
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [hasPredictions, setHasPredictions] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalCount = matches.length;
  const enteredCount = useMemo(
    () => Object.keys(results).length,
    [results],
  );

  const loadStored = useCallback(async () => {
    setResults(buildResultMap(matches));

    const latestResultAt = matches
      .map((m) => m.resultAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    setSavedAt(latestResultAt ?? "");

    if (userId) {
      const batch = await fetchSavedPredictions(userId);
      setHasPredictions(!!batch && batch.predictions.length > 0);
      setPickMap(
        batch
          ? Object.fromEntries(
              batch.predictions.map((p) => [p.matchId, p.pick]),
            )
          : {},
      );
    } else {
      setHasPredictions(false);
      setPickMap({});
    }
  }, [matches, userId]);

  useEffect(() => {
    if (!loaded) return;

    void loadStored().finally(() => setInitialized(true));
  }, [loaded, loadStored]);

  const scoreSummary = useMemo(() => {
    if (!initialized) return null;
    return summarizePredictions(matches, pickMap, results);
  }, [initialized, matches, pickMap, results]);

  function handleSelect(matchId: string, outcome: MatchOutcome) {
    if (!isAdmin) return;
    setMessage("");
    setResults((prev) => ({ ...prev, [matchId]: outcome }));
  }

  async function handleSave() {
    if (!isAdmin || enteredCount === 0) return;

    setSaving(true);
    setMessage("");

    try {
      await saveGameResults(results);
      await refresh();
      await loadStored();
      setMessage("경기 결과가 저장되었습니다.");
    } catch {
      setMessage("");
      alert("결과 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (!initialized) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
        경기 목록 불러오는 중…
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center sm:px-6">
        <p className="text-4xl">⚾</p>
        <p className="mt-4 text-lg font-semibold">등록된 경기가 없습니다</p>
        <p className="mt-2 text-sm text-[#8b9cb3]">
          {isAdmin
            ? "경기 페이지에서 경기를 먼저 등록해 주세요."
            : "관리자가 경기를 등록하면 결과가 표시됩니다."}
        </p>
        {isAdmin ? (
          <Link
            href="/matches"
            className="mt-6 inline-block rounded-xl bg-[#00d4aa] px-5 py-2.5 text-sm font-semibold text-[#0b0f14] transition-opacity hover:opacity-90"
          >
            경기 등록하러 가기
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-6 ${isAdmin ? "pb-24 sm:pb-28" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1e2a3a] bg-[#121820] px-3 py-2.5 sm:rounded-xl sm:px-5 sm:py-4">
        <div>
          <p className="text-sm text-[#8b9cb3]">
            등록 경기{" "}
            <span className="font-semibold text-[#e8edf4]">{totalCount}</span>
            · 결과 확정{" "}
            <span className="font-semibold text-[#00d4aa]">{enteredCount}</span>
          </p>
          <p className="mt-1 text-xs text-[#8b9cb3]">
            {isAdmin
              ? savedAt
                ? `마지막 저장: ${formatSavedAt(savedAt)} · 관리자 입력 모드`
                : "관리자 — 결과 입력 · 수정 가능"
              : "조회 전용 — 경기 결과와 내 예측 적중 여부 확인"}
          </p>
        </div>
        {isAdmin ? (
          <span className="rounded-full bg-[#00d4aa1a] px-3 py-1 text-xs font-medium text-[#00d4aa]">
            ADMIN
          </span>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-xl border border-[#00d4aa33] bg-[#00d4aa1a] px-5 py-4 text-center text-sm font-medium text-[#00d4aa]">
          {message}
        </div>
      ) : null}

      {!hasPredictions ? (
        <div className="rounded-xl border border-[#1e2a3a] bg-[#121820] px-5 py-4 text-sm text-[#8b9cb3]">
          {isAdmin
            ? "저장된 회원 예측이 없습니다."
            : "예측을 제출하면 적중/미적중을 확인할 수 있습니다."}{" "}
          <Link href="/predict" className="font-semibold text-[#00d4aa] hover:underline">
            예측하기
          </Link>
        </div>
      ) : null}

      {scoreSummary &&
      hasPredictions &&
      scoreSummary.details.some((d) => d.pick) ? (
        <section className="rounded-2xl border border-[#1e2a3a] bg-[#121820]">
          <div className="border-b border-[#1e2a3a] px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">내 예측 적중 결과</h2>
            {scoreSummary.details.some((d) => d.pick && d.result) ? (
              <p className="mt-1 text-sm text-[#8b9cb3]">
                적중 {scoreSummary.hits} · 미적중 {scoreSummary.misses} ·
                적중률{" "}
                <span className="font-semibold text-[#00d4aa]">
                  {scoreSummary.hitRate}%
                </span>
                {scoreSummary.pending > 0
                  ? ` · 결과 대기 ${scoreSummary.pending}경기`
                  : null}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#8b9cb3]">
                경기 결과가 입력되면 적중/미적중이 표시됩니다.
              </p>
            )}
          </div>
          <ul className="divide-y divide-[#1e2a3a]">
            {scoreSummary.details
              .filter((d) => d.pick)
              .map((detail) => {
                const match = matches.find((m) => m.id === detail.matchId)!;
                return (
                  <li
                    key={detail.matchId}
                    className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {detail.homeTeam}{" "}
                        <span className="text-[#8b9cb3]">vs</span>{" "}
                        {detail.awayTeam}
                      </p>
                      <p className="mt-1 text-xs text-[#8b9cb3]">
                        내 예측: {outcomeLabel(match, detail.pick!)}
                        {detail.result
                          ? ` · 결과: ${outcomeLabel(match, detail.result)}`
                          : " · 결과 대기 중"}
                      </p>
                    </div>
                    <StatusBadge status={detail.status} />
                  </li>
                );
              })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#1e2a3a] bg-[#121820]">
        <div className="border-b border-[#1e2a3a] px-4 py-5 sm:px-6">
          <h2 className="text-lg font-semibold">경기별 결과</h2>
          <p className="mt-1 text-sm text-[#8b9cb3]">
            {isAdmin
              ? "승패 결과를 선택하고 저장하세요."
              : "확정된 경기 결과를 확인하세요."}
          </p>
        </div>
        <ul className="divide-y divide-[#1e2a3a]">
          {matches.map((match) => {
            const outcome = results[match.id];
            const detail = scoreSummary?.details.find(
              (d) => d.matchId === match.id,
            );

            return (
              <li key={match.id} className="p-3 sm:p-6">
                <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:mb-4 sm:gap-x-2 sm:gap-y-2">
                  <SportBadge sport={match.sport} />
                  <span className="text-xs text-[#8b9cb3]">
                    {formatMatchDate(match.scheduledAt)}
                  </span>
                  {outcome ? (
                    <span className="rounded-full bg-[#00d4aa1a] px-2.5 py-0.5 text-xs font-medium text-[#00d4aa] sm:ml-auto">
                      결과 확정
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#1e2a3a] px-2.5 py-0.5 text-xs text-[#8b9cb3] sm:ml-auto">
                      미확정
                    </span>
                  )}
                </div>

                <p className="mb-2 break-words text-sm font-semibold sm:mb-3 sm:text-lg">
                  {match.homeTeam}
                  <span className="mx-2 text-sm font-normal text-[#8b9cb3]">
                    vs
                  </span>
                  {match.awayTeam}
                </p>

                {detail?.pick ? (
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[#8b9cb3]">
                      내 예측: {outcomeLabel(match, detail.pick)}
                    </span>
                    {detail.result ? (
                      <StatusBadge status={detail.status} />
                    ) : null}
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="flex min-w-0 flex-row gap-2 sm:flex-row sm:gap-3">
                    <OutcomeButton
                      label={match.homeTeam}
                      subLabel="홈팀 승"
                      selected={outcome === "home"}
                      onClick={() => handleSelect(match.id, "home")}
                    />
                    <OutcomeButton
                      label={match.awayTeam}
                      subLabel="원정팀 승"
                      selected={outcome === "away"}
                      onClick={() => handleSelect(match.id, "away")}
                    />
                  </div>
                ) : outcome ? (
                  <div className="flex min-w-0 flex-row gap-2 sm:flex-row sm:gap-3">
                    <ResultDisplay
                      label={match.homeTeam}
                      subLabel="홈팀 승"
                      winner={outcome === "home"}
                    />
                    <ResultDisplay
                      label={match.awayTeam}
                      subLabel="원정팀 승"
                      winner={outcome === "away"}
                    />
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#1e2a3a] bg-[#0b0f14] px-4 py-3 text-sm text-[#8b9cb3]">
                    아직 결과가 입력되지 않았습니다.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isAdmin ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1e2a3a] bg-[#0b0f14ee] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:pb-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-[#8b9cb3] sm:text-left">
              {enteredCount}/{totalCount}경기 결과 선택
            </p>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={enteredCount === 0 || saving}
              className={
                enteredCount > 0 && !saving
                  ? "w-full rounded-xl bg-[#00d4aa] py-3.5 text-sm font-bold text-[#0b0f14] transition-opacity hover:opacity-90 sm:w-auto sm:px-10"
                  : "w-full cursor-not-allowed rounded-xl bg-[#1e2a3a] py-3.5 text-sm font-bold text-[#8b9cb3] sm:w-auto sm:px-10"
              }
            >
              {saving ? "저장 중…" : "결과 저장"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
