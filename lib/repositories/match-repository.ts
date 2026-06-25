import { rowToMatch } from "@/lib/match-mapper";
import { fetchMatches } from "@/lib/match-store";
import type { GameRowChange } from "@/lib/supabase/client";
import { subscribeToGames } from "@/lib/supabase/client";
import type { Match } from "@/lib/types";

function sortBySchedule(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
}

/** Realtime payload → 로컬 matches state 패치 (전체 refetch 없음) */
export function applyGameChange(
  matches: Match[],
  change: GameRowChange,
): Match[] {
  if (change.eventType === "DELETE") {
    const id = change.old?.id;
    if (!id) return matches;
    return matches.filter((m) => m.id !== id);
  }

  const row = change.new;
  if (!row?.id) return matches;

  const match = rowToMatch(row);
  const index = matches.findIndex((m) => m.id === match.id);

  if (index === -1) {
    return sortBySchedule([...matches, match]);
  }

  const next = [...matches];
  next[index] = match;
  return next;
}

export function extractSyncedAt(change: GameRowChange): string | null {
  return change.new?.synced_at ?? change.old?.synced_at ?? null;
}

export async function loadAllMatches(): Promise<Match[]> {
  return fetchMatches();
}

/**
 * games 테이블 Realtime 구독
 * LIVE / Finished / Cancelled / Postponed + 점수·이닝(status_detail) 반영
 */
export function subscribeToMatchChanges(
  onChange: (change: GameRowChange, nextMatches: Match[]) => void,
  getMatches: () => Match[],
): () => void {
  return subscribeToGames((change) => {
    onChange(change, applyGameChange(getMatches(), change));
  });
}
