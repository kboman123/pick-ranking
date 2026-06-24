"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useNickname } from "@/hooks/useNickname";

const PUBLIC_NAV = [
  { href: "/", label: "홈" },
  { href: "/predict", label: "예측하기" },
  { href: "/ranking", label: "랭킹" },
  { href: "/results", label: "결과" },
];

const ADMIN_NAV = [{ href: "/matches", label: "경기" }];

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  className = "",
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        isActive
          ? `rounded-lg bg-[#00d4aa1a] px-3 py-2 font-medium text-[#00d4aa] ${className}`
          : `rounded-lg px-3 py-2 text-[#8b9cb3] transition-colors hover:text-[#e8edf4] ${className}`
      }
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { isAdmin, ready: adminReady, logout } = useAdmin();
  const { nickname, ready: nicknameReady } = useNickname();
  const [menuOpen, setMenuOpen] = useState(false);

  const ready = adminReady && nicknameReady;
  const navItems = isAdmin ? [...PUBLIC_NAV, ...ADMIN_NAV] : PUBLIC_NAV;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="border-b border-[#1e2a3a] bg-[#12182080] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00d4aa26] text-[#00d4aa] sm:h-9 sm:w-9 sm:rounded-xl">
            <span className="text-base font-bold sm:text-lg">P</span>
          </div>
          <span className="truncate text-sm font-bold tracking-tight text-[#e8edf4] sm:text-lg">
            안유픽랭킹
          </span>
        </Link>

        {ready ? (
          <nav className="hidden items-center gap-1 text-sm md:flex md:gap-2">
            {navItems.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                pathname={pathname}
              />
            ))}

            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-lg border border-[#00d4aa33] px-3 py-2 text-xs font-medium text-[#00d4aa]"
                >
                  ADMIN
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg border border-[#1e2a3a] px-3 py-2 text-[#8b9cb3] transition-colors hover:text-[#e8edf4]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {nickname ? (
                  <span className="max-w-[7rem] truncate rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-3 py-2 text-xs font-medium text-[#00d4aa]">
                    {nickname}
                  </span>
                ) : null}
                <Link
                  href="/admin"
                  className="rounded-lg border border-[#1e2a3a] px-3 py-2 text-xs text-[#8b9cb3] transition-colors hover:border-[#00d4aa4d] hover:text-[#e8edf4]"
                >
                  관리자
                </Link>
              </>
            )}
          </nav>
        ) : null}

        {ready ? (
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1e2a3a] text-[#e8edf4] md:hidden"
          >
            <span className="sr-only">메뉴</span>
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="h-8 w-8 shrink-0 md:hidden" aria-hidden />
        )}
      </div>

      {ready && menuOpen ? (
        <div className="border-t border-[#1e2a3a] bg-[#121820] px-3 py-3 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {navItems.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
                className="block w-full py-1.5 text-sm"
              />
            ))}
          </nav>

          <div className="mt-3 space-y-1.5 border-t border-[#1e2a3a] pt-3">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg border border-[#00d4aa33] px-3 py-2 text-center text-sm font-medium text-[#00d4aa]"
                >
                  관리자 페이지
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void logout();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-lg border border-[#1e2a3a] px-3 py-2 text-sm text-[#8b9cb3]"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {nickname ? (
                  <p className="rounded-lg border border-[#00d4aa33] bg-[#00d4aa1a] px-3 py-2 text-center text-sm font-medium text-[#00d4aa]">
                    {nickname}
                  </p>
                ) : null}
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg border border-[#1e2a3a] px-3 py-2 text-center text-sm text-[#8b9cb3]"
                >
                  관리자
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
