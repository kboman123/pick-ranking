"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MATCHES_UPDATED_EVENT,
  RESULTS_UPDATED_EVENT,
} from "@/lib/events";
import {
  applyGameChange,
  extractSyncedAt,
  loadAllMatches,
  subscribeToMatchChanges,
} from "@/lib/repositories/match-repository";
import { isRealtimeEnabled } from "@/lib/supabase/client";
import type { Match } from "@/lib/types";

type UseMatchesOptions = {
  /** @deprecated Phase 3 — Realtime만 사용. false면 Realtime 구독 안 함 */
  liveUpdates?: boolean;
};

export function useMatches(options: UseMatchesOptions = {}) {
  const { liveUpdates = true } = options;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLiveUpdateAt, setLastLiveUpdateAt] = useState<string | null>(null);
  const matchesRef = useRef<Match[]>([]);

  matchesRef.current = matches;

  const refresh = useCallback(async () => {
    try {
      const data = await loadAllMatches();
      setMatches(data);
      matchesRef.current = data;
      setError(null);
    } catch (e) {
      setMatches([]);
      matchesRef.current = [];
      setError(
        e instanceof Error ? e.message : "경기 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    function onSameTabUpdate() {
      void refresh();
    }

    window.addEventListener(MATCHES_UPDATED_EVENT, onSameTabUpdate);
    window.addEventListener(RESULTS_UPDATED_EVENT, onSameTabUpdate);

    return () => {
      window.removeEventListener(MATCHES_UPDATED_EVENT, onSameTabUpdate);
      window.removeEventListener(RESULTS_UPDATED_EVENT, onSameTabUpdate);
    };
  }, [refresh]);

  useEffect(() => {
    if (!liveUpdates || !isRealtimeEnabled()) return;

    const unsubscribe = subscribeToMatchChanges((_change, nextMatches) => {
      setMatches(nextMatches);
      matchesRef.current = nextMatches;
      setLoaded(true);
      setError(null);

      const syncedAt = extractSyncedAt(_change);
      setLastLiveUpdateAt(syncedAt ?? new Date().toISOString());
    }, () => matchesRef.current);

    return unsubscribe;
  }, [liveUpdates]);

  return { matches, loaded, error, refresh, lastLiveUpdateAt };
}
