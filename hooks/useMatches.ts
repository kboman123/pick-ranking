"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMatches } from "@/lib/match-store";
import {
  MATCHES_UPDATED_EVENT,
  RESULTS_UPDATED_EVENT,
} from "@/lib/events";
import { subscribeToTable } from "@/lib/supabase/client";
import type { Match } from "@/lib/types";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMatches(await fetchMatches());
      setError(null);
    } catch (e) {
      setMatches([]);
      setError(e instanceof Error ? e.message : "경기 목록을 불러오지 못했습니다.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    function onUpdate() {
      void refresh();
    }

    window.addEventListener(MATCHES_UPDATED_EVENT, onUpdate);
    window.addEventListener(RESULTS_UPDATED_EVENT, onUpdate);

    const unsubscribe = subscribeToTable("games", onUpdate);

    return () => {
      window.removeEventListener(MATCHES_UPDATED_EVENT, onUpdate);
      window.removeEventListener(RESULTS_UPDATED_EVENT, onUpdate);
      unsubscribe();
    };
  }, [refresh]);

  return { matches, loaded, error, refresh };
}
