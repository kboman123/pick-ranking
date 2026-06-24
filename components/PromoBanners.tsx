// ──────────────────────────────────────────────
// 🔗 링크 주소 수정: 아래 URL을 본인 주소로 바꿔주세요
// ──────────────────────────────────────────────

/** 네이버카페 바로가기 URL */
const NAVER_CAFE_URL = "https://cafe.naver.com/anyousports";

/** 오픈채팅방 바로가기 URL */
const OPEN_CHAT_URL = "https://open.kakao.com/o/gTiekyvi";

const BANNERS = [
  {
    id: "naver-cafe",
    href: NAVER_CAFE_URL,
    label: "Community",
    title: "네이버카페",
    description: "픽 분석 · 경기 정보 · 회원 소통",
    icon: "N",
    glow: "shadow-[0_0_24px_rgba(3,199,90,0.25)]",
    border: "border-[#03c75a66]",
    bg: "from-[#03c75a14] to-[#121820]",
    accent: "text-[#03c75a]",
    badge: "CAFE",
  },
  {
    id: "open-chat",
    href: OPEN_CHAT_URL,
    label: "Open Chat",
    title: "오픈채팅방",
    description: "실시간 픽 공유 · 당일 경기 토론",
    icon: "💬",
    glow: "shadow-[0_0_24px_rgba(254,229,0,0.2)]",
    border: "border-[#fee50066]",
    bg: "from-[#fee50014] to-[#121820]",
    accent: "text-[#fee500]",
    badge: "CHAT",
  },
] as const;

export default function PromoBanners() {
  return (
    <section aria-label="홍보 배너" className="w-full">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8b9cb3]">
            Community
          </h2>
          <span className="text-xs text-[#8b9cb3]">함께하는 픽 커뮤니티</span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          {BANNERS.map((banner) => (
            <a
              key={banner.id}
              href={banner.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:rounded-2xl sm:p-6 ${banner.border} ${banner.bg} ${banner.glow}`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/[0.03] blur-2xl transition-opacity group-hover:opacity-150" />

              <div className="relative flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex min-w-0 items-center gap-1.5 whitespace-nowrap sm:mb-3 sm:gap-2">
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider sm:px-2 sm:text-[10px] ${banner.border} ${banner.accent}`}
                    >
                      {banner.badge}
                    </span>
                    <span className="truncate text-[10px] text-[#8b9cb3] sm:text-xs">
                      {banner.label}
                    </span>
                  </div>

                  <h3 className="whitespace-nowrap text-sm font-bold text-[#e8edf4] sm:text-xl">
                    {banner.title}
                  </h3>
                  <p className="mt-1 break-words text-[11px] leading-snug text-[#8b9cb3] sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                    {banner.description}
                  </p>

                  <p
                    className={`mt-2 inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold sm:mt-4 sm:gap-1.5 sm:text-sm ${banner.accent}`}
                  >
                    바로가기
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-base font-bold sm:h-14 sm:w-14 sm:rounded-xl sm:text-xl ${banner.border} ${banner.accent} bg-[#0b0f14]/60`}
                >
                  {banner.icon}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
