import type { Match } from "@/lib/types";

export const LIVE_SCORE_POLL_INTERVAL_MS = 2 * 60 * 1000;

export type LiveScoreSnapshot = {
  matches: Match[];
  lastPollAt: string;
  lastSyncedAt: string | null;
};

/** WebSocket 등으로 교체 가능한 transport 인터페이스 */
export interface LiveScoreTransport {
  subscribe(listener: (snapshot: LiveScoreSnapshot) => void): () => void;
  start(): void;
  stop(): void;
}

export type LiveScoreTransportMode = "polling" | "websocket";
