"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PREDICTIONS_UPDATED_EVENT,
  RESULTS_UPDATED_EVENT,
  AUTH_CHANGED_EVENT,
} from "@/lib/events";
import type { RankedMember } from "@/lib/ranking";
import { fetchRanking } from "@/lib/ranking-store";
import type { RankingPeriod } from "@/lib/ranking-period";
import { subscribeToTable } from "@/lib/supabase/client";

export function useRanking(period: RankingPeriod = "weekly") {
  const [ranking, setRanking] = useState<RankedMember[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRanking(await fetchRanking(period));
    } catch {
      setRanking([]);
    } finally {
      setLoaded(true);
    }
  }, [period]);

  useEffect(() => {
    setLoaded(false);
    void refresh();

    function onUpdate() {
      void refresh();
    }

    window.addEventListener(PREDICTIONS_UPDATED_EVENT, onUpdate);
    window.addEventListener(RESULTS_UPDATED_EVENT, onUpdate);
    window.addEventListener(AUTH_CHANGED_EVENT, onUpdate);

    const unsubPredictions = subscribeToTable("predictions", onUpdate);
    const unsubGames = subscribeToTable("games", onUpdate);

    return () => {
      window.removeEventListener(PREDICTIONS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(RESULTS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(AUTH_CHANGED_EVENT, onUpdate);
      unsubPredictions();
      unsubGames();
    };
  }, [refresh]);

  return { ranking, loaded, refresh };
}
