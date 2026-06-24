"use client";

import NicknameModal from "@/components/NicknameModal";
import { useNickname } from "@/hooks/useNickname";
import {
  getSupabaseEnvErrorMessage,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function NicknameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, ready, refresh } = useNickname();

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

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
        로딩 중…
      </div>
    );
  }

  return (
    <>
      {children}
      {!isLoggedIn ? <NicknameModal onSuccess={refresh} /> : null}
    </>
  );
}
