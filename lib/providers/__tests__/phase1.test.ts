/**
 * Phase 1 — Provider layer smoke tests (no external API calls)
 * Run: npx tsx lib/providers/__tests__/phase1.test.ts
 */
import assert from "node:assert/strict";
import {
  createExternalGame,
  isExternalGameFinished,
  isExternalGameLive,
} from "@/lib/domain";
import { matchLocalGameToExternal } from "@/lib/providers/shared/team-matcher";
import {
  extractLiveDetail,
  normalizeRawStatus,
  resolveWinnerFromScores,
} from "@/lib/providers/shared/normalize-status";
import {
  getProviderRegistry,
  LEAGUE_PROVIDER_BINDINGS,
} from "@/lib/providers/registry";
import { ApiSportsBaseballProvider } from "@/lib/providers/api-sports/baseball.adapter";

function testNormalizeStatus() {
  assert.equal(
    normalizeRawStatus({ long: "Finished", short: "FT" }),
    "Finished",
  );
  assert.equal(
    normalizeRawStatus({ long: "In Progress", short: "IN7" }),
    "Live",
  );
  assert.equal(
    normalizeRawStatus({ long: "Not Started", short: "NS" }),
    "Scheduled",
  );
  assert.equal(
    normalizeRawStatus({ long: "Match Postponed", short: "PPD" }),
    "Postponed",
  );
  console.log("✓ normalizeRawStatus");
}

function testLiveDetail() {
  assert.equal(
    extractLiveDetail({ long: "In Progress", short: "IN7" }, "KBO"),
    "7회",
  );
  assert.equal(
    extractLiveDetail({ long: "In Progress", short: "IN7" }, "MLB"),
    "7th Inning",
  );
  assert.equal(
    extractLiveDetail({ long: "Finished", short: "FT" }, "KBO"),
    null,
  );
  console.log("✓ extractLiveDetail");
}

function testWinner() {
  assert.equal(resolveWinnerFromScores(5, 3), "home");
  assert.equal(resolveWinnerFromScores(3, 5), "away");
  assert.equal(resolveWinnerFromScores(3, 3), "draw");
  console.log("✓ resolveWinnerFromScores");
}

function testTeamMatcher() {
  const candidates = [
    createExternalGame({
      externalId: "100",
      leagueCode: "KBO",
      homeTeam: { name: "LG Twins" },
      awayTeam: { name: "Doosan Bears" },
      scheduledAt: "2026-06-25T10:00:00+00:00",
      status: "Scheduled",
      homeScore: null,
      awayScore: null,
      liveDetail: null,
      winner: null,
    }),
  ];

  const matched = matchLocalGameToExternal(
    {
      leagueCode: "KBO",
      homeTeam: "LG 트윈스",
      awayTeam: "두산 베어스",
      scheduledAt: "2026-06-25T10:00:00.000Z",
    },
    candidates,
  );

  assert.equal(matched?.externalId, "100");
  console.log("✓ matchLocalGameToExternal");
}

function testRegistry() {
  const registry = getProviderRegistry();

  assert.equal(registry.getSupportedLeagues().length, 3);
  assert.equal(LEAGUE_PROVIDER_BINDINGS.KBO.provider, "api-sports");
  assert.equal(LEAGUE_PROVIDER_BINDINGS.KBO.externalLeagueId, 5);

  const provider = registry.getProviderForLeague("NPB");
  assert.ok(provider instanceof ApiSportsBaseballProvider);
  assert.deepEqual(provider.supportedLeagues, ["KBO", "MLB", "NPB"]);
  console.log("✓ ProviderRegistry");
}

function testExternalGameHelpers() {
  const live = createExternalGame({
    externalId: "1",
    leagueCode: "MLB",
    homeTeam: { name: "A" },
    awayTeam: { name: "B" },
    scheduledAt: "2026-01-01T00:00:00Z",
    status: "Live",
    homeScore: 1,
    awayScore: 0,
    liveDetail: "3rd Inning",
    winner: "home",
  });

  assert.equal(isExternalGameLive(live), true);
  assert.equal(isExternalGameFinished(live), false);
  console.log("✓ ExternalGame helpers");
}

testNormalizeStatus();
testLiveDetail();
testWinner();
testTeamMatcher();
testRegistry();
testExternalGameHelpers();

console.log("\nPhase 1 tests passed.");
