"use client";

import { useEffect, useMemo, useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { useMatchOpinions } from "@/hooks/useMatchOpinions";
import { useNickname } from "@/hooks/useNickname";
import { useNow } from "@/hooks/useNow";
import { isMatchClosed, isMatchOpen, KST_TIMEZONE } from "@/lib/match-utils";
import {
  fetchSavedPredictions,
  picksToRecord,
  restorePicksFromBatch,
  savePredictions,
  type PickChoice,
} from "@/lib/prediction-store";
import type { Match, Sport } from "@/lib/types";
import MatchOpinionBar from "@/components/MatchOpinionBar";

function formatMatchDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
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

type PickButtonProps = {
  label: string;
  subLabel: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function PickButton({
  label,
  subLabel,
  selected,
  disabled = false,
  onClick,
}: PickButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        disabled
          ? selected
            ? "min-w-0 flex-1 cursor-not-allowed rounded-lg border border-[#00d4aa33] bg-[#00d4aa0d] px-2 py-2 text-left opacity-80 sm:rounded-xl sm:px-4 sm:py-3"
            : "min-w-0 flex-1 cursor-not-allowed rounded-lg border border-[#1e2a3a] bg-[#0b0f14]/60 px-2 py-2 text-left opacity-50 sm:rounded-xl sm:px-4 sm:py-3"
          : selected
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

function PickReadOnly({
  label,
  subLabel,
  selected,
}: {
  label: string;
  subLabel: string;
  selected: boolean;
}) {
  return (
    <div
      className={
        selected
          ? "min-w-0 flex-1 rounded-lg border border-[#00d4aa66] bg-[#00d4aa1a] px-2 py-2 sm:rounded-xl sm:px-4 sm:py-3"
          : "min-w-0 flex-1 rounded-lg border border-[#1e2a3a] bg-[#0b0f14]/60 px-2 py-2 opacity-50 sm:rounded-xl sm:px-4 sm:py-3"
      }
    >
      <span
        className={
          selected
            ? "block truncate text-xs font-semibold text-[#00d4aa] sm:text-sm"
            : "block truncate text-xs font-semibold text-[#8b9cb3] sm:text-sm"
        }
      >
        {label}
      </span>
      <span className="mt-0.5 block text-[10px] text-[#8b9cb3] sm:text-xs">{subLabel}</span>
    </div>
  );
}

export default function PredictionForm() {
  const { matches, loaded } = useMatches();
  const { nickname, userId } = useNickname();
  const now = useNow();
  const [picks, setPicks] = useState<Record<string, PickChoice>>({});
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openMatches = useMemo(
    () => matches.filter((m) => isMatchOpen(m.scheduledAt, now)),
    [matches, now],
  );

  const openMatchIds = useMemo(
    () => openMatches.map((m) => m.id),
    [openMatches],
  );

  const { opinions } = useMatchOpinions(openMatchIds);

  const readOnly = submitted;

  useEffect(() => {
    if (!loaded || !userId) return;

    let cancelled = false;

    async function loadPredictions() {
      try {
        const saved = await fetchSavedPredictions(userId);
        if (cancelled) return;

        setPicks(restorePicksFromBatch(saved, openMatchIds));

        if (saved && saved.predictions.length > 0) {
          setSubmitted(true);
          setSuccessMessage("예측이 저장되었습니다 · 조회 전용");
        } else {
          setSubmitted(false);
          setSuccessMessage("");
        }
      } catch {
        if (!cancelled) setError("예측 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    void loadPredictions();

    return () => {
      cancelled = true;
    };
  }, [loaded, openMatchIds.join(","), userId]);

  const openSelectedCount = useMemo(
    () => openMatches.filter((m) => picks[m.id]).length,
    [openMatches, picks],
  );

  const openCount = openMatches.length;
  const canSubmit =
    !readOnly && openCount > 0 && openSelectedCount === openCount;

  function handlePick(matchId: string, choice: PickChoice, match: Match) {
    if (readOnly || isMatchClosed(match.scheduledAt, now)) return;
    setSubmitted(false);
    setSuccessMessage("");
    setError("");
    setPicks((prev) => ({ ...prev, [matchId]: choice }));
  }

  async function handleSubmit() {
    if (!canSubmit || !userId) return;

    setSubmitting(true);
    setError("");

    try {
      await savePredictions(
        picksToRecord(picks).filter((p) => openMatchIds.includes(p.matchId)),
        userId,
      );
      setSubmitted(true);
      setSuccessMessage("예측이 저장되었습니다 · 조회 전용");
    } catch {
      setError("예측 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!initialized) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
        경기 목록 불러오는 중…
      </div>
    );
  }

  if (openMatches.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center sm:px-6">
        <p className="text-4xl">📋</p>
        <p className="mt-4 text-lg font-semibold">예측 가능한 경기가 없습니다.</p>
        <p className="mt-2 text-sm text-[#8b9cb3]">
          마감된 경기는 결과 페이지에서 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 sm:space-y-6 ${!readOnly ? "pb-24 sm:pb-28" : ""}`}>
      <div className="rounded-lg border border-[#1e2a3a] bg-[#121820] px-3 py-2.5 sm:rounded-xl sm:px-5 sm:py-4">
        <p className="text-xs text-[#8b9cb3] sm:text-sm">
          <span className="font-semibold text-[#00d4aa]">{nickname}</span>
          님 · 예측 가능{" "}
          <span className="font-semibold text-[#00d4aa]">{openCount}</span>
          경기
        </p>
        <p className="mt-0.5 text-[10px] text-[#8b9cb3] sm:mt-1 sm:text-xs">
          경기 시작 시간(KST)이 지나면 예측 페이지에서 숨겨집니다.
        </p>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-3 py-2.5 text-center text-xs font-medium text-[#00d4aa] sm:rounded-xl sm:px-5 sm:py-4 sm:text-sm">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-center text-xs text-red-400 sm:rounded-xl sm:px-5 sm:py-4 sm:text-sm">
          {error}
        </div>
      ) : null}

      {!readOnly && openCount > 0 ? (
        <div className="rounded-lg border border-[#1e2a3a] bg-[#121820] px-3 py-2.5 sm:rounded-xl sm:px-5 sm:py-4">
          <p className="text-xs text-[#8b9cb3] sm:text-sm">
            <span className="font-semibold text-[#00d4aa]">
              {openSelectedCount}
            </span>
            <span className="text-[#e8edf4]"> / {openCount}</span> 예측 가능
            경기 선택됨
          </p>
          <p className="mt-0.5 text-[10px] text-[#8b9cb3] sm:mt-1 sm:text-xs">
            예측 가능한 모든 경기를 선택해야 제출할 수 있습니다.
          </p>
        </div>
      ) : null}

      <ul className="space-y-2 sm:space-y-4">
        {openMatches.map((match) => {
          const pick = picks[match.id];
          const showReadOnly = readOnly;

          return (
            <li
              key={match.id}
              className="min-w-0 rounded-lg border border-[#1e2a3a] bg-[#121820] p-3 sm:rounded-2xl sm:p-6"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:mb-4 sm:gap-x-2 sm:gap-y-2">
                <SportBadge sport={match.sport} />
                <span className="text-xs text-[#8b9cb3]">
                  {formatMatchDate(match.scheduledAt)}
                </span>
                {pick ? (
                  <span className="rounded-full bg-[#00d4aa1a] px-2.5 py-0.5 text-xs font-medium text-[#00d4aa] sm:ml-auto">
                    선택 완료
                  </span>
                ) : (
                  <span className="rounded-full border border-[#1e2a3a] px-2.5 py-0.5 text-xs text-[#8b9cb3] sm:ml-auto">
                    미선택
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-row gap-2 sm:gap-3">
                {showReadOnly ? (
                  <>
                    <PickReadOnly
                      label={match.homeTeam}
                      subLabel="홈팀 승"
                      selected={pick === "home"}
                    />
                    <PickReadOnly
                      label={match.awayTeam}
                      subLabel="원정팀 승"
                      selected={pick === "away"}
                    />
                  </>
                ) : (
                  <>
                    <PickButton
                      label={match.homeTeam}
                      subLabel="홈팀 승"
                      selected={pick === "home"}
                      onClick={() => handlePick(match.id, "home", match)}
                    />
                    <PickButton
                      label={match.awayTeam}
                      subLabel="원정팀 승"
                      selected={pick === "away"}
                      onClick={() => handlePick(match.id, "away", match)}
                    />
                  </>
                )}
              </div>

              <MatchOpinionBar
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                opinion={opinions[match.id]}
              />
            </li>
          );
        })}
      </ul>

      {!readOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1e2a3a] bg-[#0b0f14ee] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:pb-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-center text-xs text-[#8b9cb3] sm:text-left sm:text-sm">
              {openCount > 0 ? (
                <>
                  <span className="font-semibold text-[#e8edf4]">
                    {openSelectedCount}
                  </span>
                  /{openCount} 예측 가능 경기 선택
                </>
              ) : (
                "예측 가능한 경기 없음"
              )}
            </p>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || submitting}
              className={
                canSubmit && !submitting
                  ? "w-full rounded-lg bg-[#00d4aa] py-2.5 text-xs font-bold text-[#0b0f14] transition-opacity hover:opacity-90 sm:rounded-xl sm:py-3.5 sm:text-sm sm:w-auto sm:px-10"
                  : "w-full cursor-not-allowed rounded-lg bg-[#1e2a3a] py-2.5 text-xs font-bold text-[#8b9cb3] sm:rounded-xl sm:py-3.5 sm:text-sm sm:w-auto sm:px-10"
              }
            >
              {submitting ? "제출 중…" : "예측 제출"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
