import {
  clearAdminCookie,
  persistAdminCookie,
  readAdminCookie,
} from "@/app/actions/session";
import { ADMIN_AUTH_CHANGED_EVENT } from "./storage-keys";

// ──────────────────────────────────────────────
// 🔑 임시 관리자 비밀번호 — 나중에 실제 로그인으로 교체
// ──────────────────────────────────────────────
const ADMIN_PASSWORD = "1234";

let adminLoggedIn = false;

export function isAdminLoggedIn(): boolean {
  return adminLoggedIn;
}

export async function refreshAdminSession(): Promise<boolean> {
  adminLoggedIn = await readAdminCookie();
  return adminLoggedIn;
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;
  await persistAdminCookie();
  adminLoggedIn = true;
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT));
  return true;
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie();
  adminLoggedIn = false;
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT));
}
