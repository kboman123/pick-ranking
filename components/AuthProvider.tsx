"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import LoginScreen from "@/components/LoginScreen";
import { useAuth } from "@/hooks/useAuth";
import {
  isPublicPath,
  isSetupPath,
  LOGIN_PATH,
  SETUP_PATH,
} from "@/lib/auth-routes";
import {
  getSupabaseEnvErrorMessage,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname);
  const isSetup = isSetupPath(pathname);
  const { authenticated, hasProfile, ready } = useAuth();

  useEffect(() => {
    if (!ready || isPublic) return;

    if (!authenticated) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (!hasProfile && !isSetup) {
      router.replace(SETUP_PATH);
      return;
    }

    if (hasProfile && isSetup) {
      router.replace("/");
    }
  }, [ready, authenticated, hasProfile, isPublic, isSetup, router]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] px-4 text-[#e8edf4]">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#121820] p-6">
          <h2 className="text-lg font-semibold text-red-400">
            Supabase 환경변수 오류
          </h2>
          <pre className="mt-4 whitespace-pre-wrap text-sm text-[#8b9cb3]">
            {getSupabaseEnvErrorMessage()}
          </pre>
        </div>
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
        로딩 중…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
        로그인 화면으로 이동 중…
      </div>
    );
  }

  if (isSetup && !hasProfile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
        <Header />
        {children}
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
        닉네임 설정으로 이동 중…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
      <Header />
      {children}
    </div>
  );
}
