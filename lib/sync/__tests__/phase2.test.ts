/**
 * Phase 2 — auto-register & dedup tests (no external API)
 * Run: npx tsx lib/sync/__tests__/phase2.test.ts
 */
import assert from "node:assert/strict";
import { createExternalGame } from "@/lib/domain";
import {
  formatDateKst,
  getKstDayBounds,
  getTodayKst,
  isScheduledOnKstDate,
} from "@/lib/sync/dates";
import { buildGameIndex, findExistingGame } from "@/lib/sync/game-index";
import { buildGameWritePayload } from "@/lib/sync/game-updater";
import type { IndexedGame } from "@/lib/sync/game-index";

function testKstDates() {
  const bounds = getKstDayBounds("2026-06-25");
  assert.ok(bounds.start.endsWith("Z"));
  assert.ok(new Date(bounds.start) < new Date(bounds.end));

  const noonKst = "2026-06-25T03:00:00.000Z";
  assert.equal(isScheduledOnKstDate(noonKst, "2026-06-25"), true);
  assert.equal(isScheduledOnKstDate(noonKst, "2026-06-24"), false);
  console.log("✓ KST dates");
}

function testDedupByExternalId() {
  const dbGame: IndexedGame = {
    id: "uuid-1",
    sport: "KBO",
    home_team: "LG Twins",
    away_team: "Doosan Bears",
    scheduled_at: "2026-06-25T10:00:00+00:00",
    result: null,
    status: "Scheduled",
    api_sports_game_id: 999,
  };

  const external = createExternalGame({
    externalId: "999",
    leagueCode: "KBO",
    homeTeam: { name: "LG Twins" },
    awayTeam: { name: "Doosan Bears" },
    scheduledAt: "2026-06-25T10:00:00+00:00",
    status: "Live",
    homeScore: 2,
    awayScore: 1,
    liveDetail: "5회",
    winner: "home",
  });

  const index = buildGameIndex([dbGame]);
  const found = findExistingGame(external, index);
  assert.equal(found?.id, "uuid-1");
  console.log("✓ dedup by external id");
}

function testDedupByTeamMatch() {
  const dbGame: IndexedGame = {
    id: "uuid-2",
    sport: "KBO",
    home_team: "LG 트윈스",
    away_team: "두산 베어스",
    scheduled_at: "2026-06-25T10:00:00.000Z",
    result: null,
    status: "Scheduled",
    api_sports_game_id: null,
  };

  const external = createExternalGame({
    externalId: "1001",
    leagueCode: "KBO",
    homeTeam: { name: "LG Twins" },
    awayTeam: { name: "Doosan Bears" },
    scheduledAt: "2026-06-25T10:00:00+00:00",
    status: "Scheduled",
    homeScore: null,
    awayScore: null,
    liveDetail: null,
    winner: null,
  });

  const found = findExistingGame(external, buildGameIndex([dbGame]));
  assert.equal(found?.id, "uuid-2");
  console.log("✓ dedup by team match");
}

function testCancelledPostponedPayload() {
  const cancelled = createExternalGame({
    externalId: "200",
    leagueCode: "NPB",
    homeTeam: { name: "Giants" },
    awayTeam: { name: "Tigers" },
    scheduledAt: "2026-06-25T09:00:00+00:00",
    status: "Cancelled",
    homeScore: null,
    awayScore: null,
    liveDetail: null,
    winner: null,
  });

  const payload = buildGameWritePayload(cancelled, "2026-06-25T00:00:00.000Z");
  assert.equal(payload.status, "Cancelled");
  assert.equal(payload.result, null);

  const postponed = createExternalGame({
    externalId: "201",
    leagueCode: "MLB",
    homeTeam: { name: "Red Sox" },
    awayTeam: { name: "Yanks" },
    scheduledAt: "2026-06-25T09:00:00+00:00",
    status: "Postponed",
    homeScore: null,
    awayScore: null,
    liveDetail: null,
    winner: null,
  });

  const payload2 = buildGameWritePayload(postponed, "2026-06-25T00:00:00.000Z");
  assert.equal(payload2.status, "Postponed");
  console.log("✓ cancelled/postponed payload");
}

function testScheduledAtStored() {
  const external = createExternalGame({
    externalId: "300",
    leagueCode: "MLB",
    homeTeam: { name: "A" },
    awayTeam: { name: "B" },
    scheduledAt: "2026-06-25T23:05:00+00:00",
    status: "Scheduled",
    homeScore: null,
    awayScore: null,
    liveDetail: null,
    winner: null,
  });

  const payload = buildGameWritePayload(external, "2026-06-25T00:00:00.000Z");
  assert.equal(payload.scheduled_at, "2026-06-25T23:05:00+00:00");
  console.log("✓ scheduled_at preserved");
}

testKstDates();
testDedupByExternalId();
testDedupByTeamMatch();
testCancelledPostponedPayload();
testScheduledAtStored();

console.log(`\nPhase 2 tests passed (today KST: ${getTodayKst()}, formatted: ${formatDateKst()})`);
