/**
 * Phase 3 Realtime — applyGameChange unit tests
 * Run: npx tsx lib/repositories/__tests__/phase3.test.ts
 */
import assert from "node:assert/strict";
import { applyGameChange, extractSyncedAt } from "@/lib/repositories/match-repository";
import type { GameRowChange } from "@/lib/supabase/client";
import type { DbGame } from "@/lib/supabase/database.types";
import type { Match } from "@/lib/types";

const baseRow: DbGame = {
  id: "game-1",
  sport: "KBO",
  home_team: "LG Twins",
  away_team: "Doosan Bears",
  scheduled_at: "2026-06-25T10:00:00.000Z",
  result: null,
  result_at: null,
  home_score: 0,
  away_score: 0,
  status: "Live",
  status_detail: "3회",
  api_sports_game_id: 100,
  synced_at: "2026-06-25T10:30:00.000Z",
  created_at: "2026-06-25T09:00:00.000Z",
  updated_at: "2026-06-25T10:30:00.000Z",
};

const baseMatch: Match = {
  id: "game-1",
  sport: "KBO",
  homeTeam: "LG Twins",
  awayTeam: "Doosan Bears",
  scheduledAt: "2026-06-25T10:00:00.000Z",
  createdAt: "2026-06-25T09:00:00.000Z",
  homeScore: 0,
  awayScore: 0,
  status: "Live",
  statusDetail: "3회",
  apiSportsGameId: 100,
  syncedAt: "2026-06-25T10:30:00.000Z",
};

function testLiveScorePatch() {
  const updated: DbGame = {
    ...baseRow,
    home_score: 3,
    away_score: 2,
    status_detail: "5회",
    synced_at: "2026-06-25T10:35:00.000Z",
  };

  const change: GameRowChange = {
    eventType: "UPDATE",
    new: updated,
    old: baseRow,
  };

  const next = applyGameChange([baseMatch], change);
  assert.equal(next[0].homeScore, 3);
  assert.equal(next[0].awayScore, 2);
  assert.equal(next[0].status, "Live");
  assert.equal(next[0].statusDetail, "5회");
  console.log("✓ LIVE score/inning patch");
}

function testFinishedPatch() {
  const updated: DbGame = {
    ...baseRow,
    status: "Finished",
    status_detail: null,
    home_score: 5,
    away_score: 3,
    result: "home",
    result_at: "2026-06-25T12:00:00.000Z",
  };

  const next = applyGameChange([baseMatch], {
    eventType: "UPDATE",
    new: updated,
    old: baseRow,
  });

  assert.equal(next[0].status, "Finished");
  assert.equal(next[0].result, "home");
  assert.equal(next[0].statusDetail, null);
  console.log("✓ Finished patch");
}

function testCancelledPostponed() {
  const cancelled = applyGameChange([baseMatch], {
    eventType: "UPDATE",
    new: { ...baseRow, status: "Cancelled", home_score: null, away_score: null },
    old: baseRow,
  });
  assert.equal(cancelled[0].status, "Cancelled");

  const postponed = applyGameChange([baseMatch], {
    eventType: "UPDATE",
    new: { ...baseRow, status: "Postponed" },
    old: baseRow,
  });
  assert.equal(postponed[0].status, "Postponed");
  console.log("✓ Cancelled/Postponed patch");
}

function testInsertAndDelete() {
  const inserted = applyGameChange([], {
    eventType: "INSERT",
    new: baseRow,
    old: null,
  });
  assert.equal(inserted.length, 1);

  const deleted = applyGameChange([baseMatch], {
    eventType: "DELETE",
    new: null,
    old: baseRow,
  });
  assert.equal(deleted.length, 0);
  console.log("✓ INSERT/DELETE patch");
}

function testExtractSyncedAt() {
  assert.equal(
    extractSyncedAt({ eventType: "UPDATE", new: baseRow, old: null }),
    baseRow.synced_at,
  );
  console.log("✓ extractSyncedAt");
}

testLiveScorePatch();
testFinishedPatch();
testCancelledPostponed();
testInsertAndDelete();
testExtractSyncedAt();

console.log("\nPhase 3 tests passed.");
