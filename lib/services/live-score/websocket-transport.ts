import type { LiveScoreSnapshot, LiveScoreTransport } from "./types";

/**
 * WebSocket transport 스텁 — 추후 서버 push 연동 시 구현
 * NEXT_PUBLIC_LIVE_SCORE_TRANSPORT=websocket 으로 전환
 */
export class WebSocketLiveScoreTransport implements LiveScoreTransport {
  subscribe(_listener: (snapshot: LiveScoreSnapshot) => void): () => void {
    return () => {};
  }

  start(): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[LiveScore] WebSocket transport is not implemented yet. Falling back is disabled — use polling.",
      );
    }
  }

  stop(): void {}
}
