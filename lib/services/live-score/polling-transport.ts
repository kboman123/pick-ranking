/**
 * Phase 3: 클라이언트 polling transport (폐기)
 * @deprecated Supabase Realtime + lib/repositories/match-repository 사용
 */
import {
  LIVE_SCORE_POLL_INTERVAL_MS,
  type LiveScoreSnapshot,
  type LiveScoreTransport,
} from "./types";

/** @deprecated no-op — Phase 3 Realtime */
export class PollingLiveScoreTransport implements LiveScoreTransport {
  subscribe(_listener: (snapshot: LiveScoreSnapshot) => void): () => void {
    return () => {};
  }

  start(): void {}

  stop(): void {}
}

export { LIVE_SCORE_POLL_INTERVAL_MS };
