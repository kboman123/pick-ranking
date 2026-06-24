"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLoggedInNickname,
  getLoggedInUserId,
  isLoggedIn,
  restoreSession,
} from "@/lib/nickname-store";
import { NICKNAME_CHANGED_EVENT } from "@/lib/events";
import { getSession } from "@/lib/session";
import { subscribeToTable } from "@/lib/supabase/client";

export function useNickname() {
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await restoreSession();
      setNickname(getLoggedInNickname());
      setUserId(getLoggedInUserId());
    } catch {
      setNickname("");
      setUserId("");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    function onUpdate() {
      void refresh();
    }

    window.addEventListener(NICKNAME_CHANGED_EVENT, onUpdate);

    const unsubscribe = subscribeToTable("users", onUpdate);

    return () => {
      window.removeEventListener(NICKNAME_CHANGED_EVENT, onUpdate);
      unsubscribe();
    };
  }, [refresh]);

  return {
    nickname,
    userId,
    isLoggedIn: ready && isLoggedIn(),
    ready,
    refresh,
  };
}

export function useSessionKey(): string {
  const session = getSession();
  return session ? `${session.userId}:${session.nickname}` : "";
}
