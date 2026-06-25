"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { triggerResultSync } from "@/app/actions/sync-results";
import { useAdmin } from "@/hooks/useAdmin";
import { loginAdmin } from "@/lib/admin-auth";
import type { SyncResultSummary } from "@/lib/services/result-sync";

const inputClass =
  "w-full rounded-xl border border-[#1e2a3a] bg-[#0b0f14] px-4 py-3 text-[#e8edf4] outline-none transition-colors focus:border-[#00d4aa66] focus:ring-1 focus:ring-[#00d4aa33]";

export default function AdminPanel() {
  const router = useRouter();
  const { isAdmin, ready, logout } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [syncSummary, setSyncSummary] = useState<SyncResultSummary | null>(null);
  const [isSyncing, startSync] = useTransition();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (await loginAdmin(password)) {
      setPassword("");
      router.refresh();
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  }

  async function handleLogout() {
    await logout();
    setPassword("");
    setError("");
    setSyncMessage("");
    setSyncSummary(null);
  }

  function handleSyncResults() {
    setSyncMessage("");
    setSyncSummary(null);

    startSync(async () => {
      try {
        const summary = await triggerResultSync();
        setSyncSummary(summary);

        if (summary.errors.length > 0) {
          setSyncMessage(
            `동기화 완료 (일부 오류 ${summary.errors.length}건). 아래 상세를 확인하세요.`,
          );
        } else {
          setSyncMessage(
            `동기화 완료 — 신규 ${summary.created} · 업데이트 ${summary.updated} · 종료 ${summary.finished} · 예측 판정 ${summary.predictionsEvaluated}`,
          );
        }
      } catch {
        setSyncMessage("동기화에 실패했습니다. API 키와 Supabase service role을 확인하세요.");
      }
    });
  }

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[#1e2a3a] bg-[#121820] px-4 py-16 text-center text-[#8b9cb3] sm:px-6">
        로딩 중…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border border-[#1e2a3a] bg-[#121820] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-3xl">🔐</p>
          <h2 className="mt-4 text-xl font-bold">관리자 로그인</h2>
          <p className="mt-2 text-sm text-[#8b9cb3]">
            임시 비밀번호로 관리자 기능에 접근합니다.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="adminPassword"
              className="mb-2 block text-sm font-medium text-[#8b9cb3]"
            >
              관리자 비밀번호
            </label>
            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#00d4aa] py-3 font-semibold text-[#0b0f14] transition-opacity hover:opacity-90"
          >
            로그인
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#8b9cb3]">
          회원은{" "}
          <Link href="/predict" className="text-[#00d4aa] hover:underline">
            예측하기
          </Link>
          와{" "}
          <Link href="/ranking" className="text-[#00d4aa] hover:underline">
            랭킹
          </Link>
          만 이용할 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-3 py-2.5 sm:rounded-xl sm:px-5 sm:py-4">
        <p className="text-xs font-medium text-[#00d4aa] sm:text-sm">
          관리자로 로그인되었습니다
        </p>
        <p className="mt-1 text-xs text-[#8b9cb3]">
          세션 쿠키로 로그인 상태가 유지됩니다. 새로고침 후에도 유지됩니다.
        </p>
      </div>

      <section className="rounded-lg border border-[#1e2a3a] bg-[#121820] p-3 sm:rounded-2xl sm:p-6">
        <h3 className="text-sm font-semibold sm:text-lg">경기 결과 자동 동기화</h3>
        <p className="mt-1 text-xs text-[#8b9cb3] sm:text-sm">
          Cron/API-SPORTS가 오늘 KBO · NPB · MLB 경기를 자동 등록하고 결과·
          취소·연기 상태를 반영합니다. 수동 경기 등록은 선택 사항입니다.
        </p>

        {syncMessage ? (
          <p className="mt-3 rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-3 py-2 text-xs text-[#00d4aa] sm:text-sm">
            {syncMessage}
          </p>
        ) : null}

        {syncSummary?.errors.length ? (
          <ul className="mt-2 list-inside list-disc text-xs text-red-400">
            {syncSummary.errors.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={handleSyncResults}
          disabled={isSyncing}
          className="mt-4 w-full rounded-xl border border-[#00d4aa33] bg-[#00d4aa1a] py-3 text-sm font-semibold text-[#00d4aa] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {isSyncing ? "동기화 중…" : "지금 동기화"}
        </button>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Link
          href="/matches"
          className="group rounded-lg border border-[#1e2a3a] bg-[#121820] p-3 transition-colors hover:border-[#00d4aa33] sm:rounded-2xl sm:p-6"
        >
          <p className="text-xl sm:text-2xl">⚾</p>
          <h3 className="mt-2 text-sm font-semibold group-hover:text-[#00d4aa] sm:mt-3 sm:text-lg">
            경기 등록
          </h3>
          <p className="mt-0.5 text-[11px] text-[#8b9cb3] sm:mt-1 sm:text-sm">
            KBO · MLB · NPB 경기 등록 및 수정
          </p>
        </Link>

        <Link
          href="/results"
          className="group rounded-lg border border-[#1e2a3a] bg-[#121820] p-3 transition-colors hover:border-[#00d4aa33] sm:rounded-2xl sm:p-6"
        >
          <p className="text-xl sm:text-2xl">📊</p>
          <h3 className="mt-2 text-sm font-semibold group-hover:text-[#00d4aa] sm:mt-3 sm:text-lg">
            결과 입력
          </h3>
          <p className="mt-0.5 text-[11px] text-[#8b9cb3] sm:mt-1 sm:text-sm">
            경기 결과 입력 및 예측 적중 판정
          </p>
        </Link>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-[#1e2a3a] px-4 py-2 text-sm text-[#8b9cb3] transition-colors hover:border-red-500/30 hover:text-red-400"
        >
          관리자 로그아웃
        </button>
      </div>
    </div>
  );
}
