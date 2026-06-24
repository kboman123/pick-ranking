"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserProfileByAuthId } from "@/app/actions/user-profile";
import LoginScreen from "@/components/LoginScreen";
import { NICKNAME_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;

    async function checkSessionOnce() {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (!session?.user) {
          logAuthRedirect("login-stay", "/login", { reason: "no-session" });
          setLoading(false);
          return;
        }

        const profile = await fetchUserProfileByAuthId(session.user.id);
        const destination = profile.ok ? "/" : NICKNAME_PATH;

        logAuthRedirect("login-session-redirect", destination, {
          hasProfile: profile.ok,
          userId: session.user.id,
        });

        router.replace(destination);
      } catch (error) {
        logAuthRedirect("login-check-error", "/login", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void checkSessionOnce();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
        확인 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      <LoginScreen variant="page" />
    </div>
  );
}
