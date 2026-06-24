"use client";

type LoginScreenProps = {
  variant?: "overlay" | "page";
};

/** 카카오 로그인 — 직접 OAuth → /auth/kakao/callback */
export default function LoginScreen({ variant = "overlay" }: LoginScreenProps) {
  async function handleKakaoLogin() {
    const { signInWithKakao } = await import("@/lib/auth-store");
    const result = await signInWithKakao();
    if (!result.ok) {
      alert(result.error);
    }
  }

  const containerClass =
    variant === "page"
      ? "flex min-h-screen items-center justify-center px-4"
      : "fixed inset-0 z-50 flex items-center justify-center px-4";

  return (
    <div className={`${containerClass} bg-[#0b0f14]`}>
      <div className="w-full max-w-md rounded-2xl border border-[#1e2a3a] bg-[#121820] p-6 text-center sm:p-8">
        <p className="text-3xl">🏆</p>
        <h1 className="mt-4 text-xl font-bold text-[#e8edf4]">안유픽랭킹</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8b9cb3]">
          카카오 계정으로 로그인하고
          <br />
          예측 · 랭킹에 참여하세요.
        </p>

        <button
          type="button"
          onClick={() => void handleKakaoLogin()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-sm font-bold text-[#191919] transition-opacity hover:opacity-90"
        >
          <span aria-hidden>💬</span>
          카카오 로그인
        </button>
      </div>
    </div>
  );
}
