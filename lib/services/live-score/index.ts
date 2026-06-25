import { PollingLiveScoreTransport } from "./polling-transport";
import {
  LIVE_SCORE_POLL_INTERVAL_MS,
  type LiveScoreSnapshot,
  type LiveScoreTransport,
  type LiveScoreTransportMode,
} from "./types";
import { WebSocketLiveScoreTransport } from "./websocket-transport";

export {
  LIVE_SCORE_POLL_INTERVAL_MS,
  type LiveScoreSnapshot,
  type LiveScoreTransport,
  type LiveScoreTransportMode,
};

/** @deprecated Phase 3 Realtime — 클라이언트에서 사용하지 않음 */
export function createLiveScoreTransport(
  mode: LiveScoreTransportMode = "polling",
): LiveScoreTransport {
  if (mode === "websocket") {
    return new WebSocketLiveScoreTransport();
  }
  return new PollingLiveScoreTransport();
}

/** @deprecated Phase 3 Realtime */
export function getLiveScoreService() {
  return {
    subscribe: (_listener: (snapshot: LiveScoreSnapshot) => void) => () => {},
  };
}
