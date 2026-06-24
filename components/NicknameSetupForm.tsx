"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { registerNickname } from "@/lib/auth-store";

type NicknameSetupFormProps = {
  onSuccess: () => void;
};

export default function NicknameSetupForm({ onSuccess }: NicknameSetupFormProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { logout } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await registerNickname(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSuccess();
    } catch {
      setError("닉네임 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-[#1e2a3a] bg-[#121820] p-5 sm:p-8">
      <div className="mb-6 text-center">
        <p className="text-3xl">✨</p>
        <h2 className="mt-4 text-xl font-bold text-[#e8edf4]">닉네임 설정</h2>
        <p className="mt-3 text-sm text-[#8b9cb3]">
          카카오 로그인이 완료되었습니다.
          <br />
          랭킹에 표시할 닉네임을 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="setupNickname"
            className="mb-2 block text-sm font-medium text-[#8b9cb3]"
          >
            닉네임 (2~12자)
          </label>
          <input
            id="setupNickname"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="예: 승부사장"
            maxLength={12}
            autoFocus
            disabled={submitting}
            className="w-full rounded-xl border border-[#1e2a3a] bg-[#0b0f14] px-4 py-3 text-[#e8edf4] outline-none transition-colors focus:border-[#00d4aa66] focus:ring-1 focus:ring-[#00d4aa33] disabled:opacity-60"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <ul className="space-y-1 text-xs text-[#8b9cb3]">
          <li>· 2~12자 (공백 불가)</li>
          <li>· 닉네임은 중복 등록할 수 없습니다</li>
          <li>· 예측·랭킹은 카카오 계정 기준으로 저장됩니다</li>
        </ul>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#00d4aa] py-3 font-semibold text-[#0b0f14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "등록 중…" : "닉네임 등록"}
        </button>

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-xl border border-[#1e2a3a] py-3 text-sm text-[#8b9cb3] transition-colors hover:text-[#e8edf4]"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
