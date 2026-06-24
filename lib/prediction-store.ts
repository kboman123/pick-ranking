import {
  PREDICTIONS_UPDATED_EVENT,
  emitDataEvent,
} from "./events";
import { getLoggedInUserId } from "./nickname-store";
import { getSupabase } from "./supabase/client";

export type PickChoice = "home" | "away";

export type PredictionRecord = {
  matchId: string;
  pick: PickChoice;
};

export type PredictionBatch = {
  submittedAt: string;
  predictions: PredictionRecord[];
};

export async function fetchSavedPredictions(
  userId?: string,
): Promise<PredictionBatch | null> {
  const id = userId ?? getLoggedInUserId();
  if (!id) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("predictions")
    .select("game_id, pick, submitted_at")
    .eq("user_id", id)
    .order("submitted_at", { ascending: false });

  if (error || !data || data.length === 0) return null;

  const latestSubmittedAt = data[0].submitted_at;

  return {
    submittedAt: latestSubmittedAt,
    predictions: data.map((row) => ({
      matchId: row.game_id,
      pick: row.pick,
    })),
  };
}

export async function savePredictions(
  predictions: PredictionRecord[],
  userId?: string,
): Promise<void> {
  const id = userId ?? getLoggedInUserId();
  if (!id) {
    throw new Error("로그인된 회원 정보가 없습니다.");
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();

  const rows = predictions.map((p) => ({
    user_id: id,
    game_id: p.matchId,
    pick: p.pick,
    submitted_at: now,
  }));

  const { error } = await supabase.from("predictions").upsert(rows, {
    onConflict: "user_id,game_id",
  });

  if (error) {
    throw new Error(error.message);
  }

  emitDataEvent(PREDICTIONS_UPDATED_EVENT);
}

export function picksToRecord(
  picks: Record<string, PickChoice>,
): PredictionRecord[] {
  return Object.entries(picks).map(([matchId, pick]) => ({ matchId, pick }));
}

export function restorePicksFromBatch(
  batch: PredictionBatch | null,
  matchIds: string[],
): Record<string, PickChoice> {
  if (!batch) return {};

  const validIds = new Set(matchIds);
  return Object.fromEntries(
    batch.predictions
      .filter((p) => validIds.has(p.matchId))
      .map((p) => [p.matchId, p.pick]),
  );
}
