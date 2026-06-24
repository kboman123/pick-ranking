"use client";

import { FormEvent, useState } from "react";
import { registerNickname } from "@/lib/nickname-store";

type NicknameModalProps = {
  onSuccess: () => void;
};

export default function NicknameModal({ onSuccess }: NicknameModalProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#0b0f14]/90 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#1e2a3a] bg-[#121820] p-5 shadow-[0_0_40px_rgba(0,212,170,0.08)] sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-3xl">🏆</p>
          <h2 className="mt-4 text-xl font-bold text-[#e8edf4]">
            픽랭킹 입장
          </h2>
          <p className="mt-3 text-base font-medium text-[#e8edf4]">
            오늘의 적중왕은 누구일까요?
          </p>
          <p className="mt-4 text-sm text-[#8b9cb3]">
            사용할 닉네임을 입력해주세요.
            <br />
            닉네임은 랭킹과 예측 기록에 사용됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="registerNickname"
              className="mb-2 block text-sm font-medium text-[#8b9cb3]"
            >
              닉네임 (2~12자)
            </label>
            <input
              id="registerNickname"
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
            <li>· 닉네임만 입력하면 바로 입장 (별도 가입 없음)</li>
            <li>· 같은 닉네임이면 기존 기록으로 입장</li>
          </ul>

          <p className="text-center text-xs text-[#8b9cb3]">
            제휴사에서 사용 중인{" "}
            <span className="font-semibold text-[#00d4aa]">제휴 닉네임</span>
            으로 등록해 주세요.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#00d4aa] py-3 font-semibold text-[#0b0f14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "등록 중…" : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
