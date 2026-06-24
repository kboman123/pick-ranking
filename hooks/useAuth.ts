"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getLoggedInNickname,
  getLoggedInUserId,
  signOut,
  syncAuthProfile,
} from "@/lib/auth-store";
import { AUTH_CHANGED_EVENT } from "@/lib/events";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { getProfile } from "@/lib/session";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { subscribeToTable } from "@/lib/supabase/client";

export function useAuth() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const state = await syncAuthProfile();
      setAuthenticated(state.authenticated);
      setHasProfile(state.hasProfile);
      setNickname(getLoggedInNickname());
      setUserId(getLoggedInUserId());
    } catch {
      setAuthenticated(false);
      setHasProfile(false);
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

    window.addEventListener(AUTH_CHANGED_EVENT, onUpdate);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        setHasProfile(false);
        setNickname("");
        setUserId("");
        setReady(true);
        return;
      }
      void refresh();
    });

    const unsubscribe = subscribeToTable("users", onUpdate);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onUpdate);
      subscription.unsubscribe();
      unsubscribe();
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    setAuthenticated(false);
    setHasProfile(false);
    setNickname("");
    setUserId("");
    setReady(true);

    await signOut();

    router.push(LOGIN_PATH);
    router.refresh();
  }, [router]);

  return {
    nickname,
    userId,
    authenticated,
    hasProfile,
    isLoggedIn: ready && authenticated && hasProfile,
    needsNickname: ready && authenticated && !hasProfile,
    ready,
    refresh,
    logout,
  };
}

export function useSessionKey(): string {
  const profile = getProfile();
  return profile ? `${profile.userId}:${profile.nickname}` : "";
}

/** @deprecated useAuth 사용 */
export const useNickname = useAuth;
