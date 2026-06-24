/**
 * 클라이언트 세션 캐시. userId는 httpOnly 쿠키에, 닉네임은 Supabase users에서 조회.
 * localStorage는 사용하지 않습니다.
 */

import {
  clearUserIdCookie,
  persistUserIdCookie,
  readUserIdCookie,
} from "@/app/actions/session";

export type UserSession = {
  userId: string;
  nickname: string;
};

let cachedSession: UserSession | null = null;

export function getSession(): UserSession | null {
  return cachedSession;
}

export function setSessionCache(session: UserSession | null): void {
  cachedSession = session;
}

export async function setSession(userId: string, nickname: string): Promise<void> {
  cachedSession = { userId, nickname };
  await persistUserIdCookie(userId);
}

export async function clearSession(): Promise<void> {
  cachedSession = null;
  await clearUserIdCookie();
}

export async function readPersistedUserId(): Promise<string | null> {
  return readUserIdCookie();
}
