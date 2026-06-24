"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGameOpinions } from "@/lib/opinion";
import type { MatchOpinion } from "@/lib/opinion";
import { PREDICTIONS_UPDATED_EVENT } from "@/lib/events";
import { subscribeToTable } from "@/lib/supabase/client";

export function useMatchOpinions(matchIds: string[]) {
  const [opinions, setOpinions] = useState<Record<string, MatchOpinion>>({});
  const [loaded, setLoaded] = useState(false);

  const idsKey = matchIds.join(",");

  const refresh = useCallback(async () => {
    if (matchIds.length === 0) {
      setOpinions({});
      setLoaded(true);
      return;
    }

    try {
      setOpinions(await fetchGameOpinions(matchIds));
    } catch {
      setOpinions({});
    } finally {
      setLoaded(true);
    }
  }, [idsKey, matchIds]);

  useEffect(() => {
    void refresh();

    function onUpdate() {
      void refresh();
    }

    window.addEventListener(PREDICTIONS_UPDATED_EVENT, onUpdate);
    const unsubscribe = subscribeToTable("predictions", onUpdate);

    return () => {
      window.removeEventListener(PREDICTIONS_UPDATED_EVENT, onUpdate);
      unsubscribe();
    };
  }, [refresh]);

  return { opinions, loaded, refresh };
}
