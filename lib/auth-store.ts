import { createUserProfile } from "@/app/actions/user-profile";
import { getSessionState } from "@/app/actions/user-session";
import { signOutServer } from "@/app/actions/auth";
import { AUTH_CHANGED_EVENT, emitDataEvent } from "./events";
import {
  clearProfileCache,
  getProfile,
  setProfileCache,
} from "./session";
import { buildKakaoAuthorizeUrl, isKakaoConfigured } from "./kakao-oauth";
import {
  clearUserIdFromStorage,
  readUserIdFromStorage,
  writeUserIdToStorage,
} from "./user-session";
import {
  USER_COLUMNS,
  USERS_TABLE,
} from "./supabase/users-schema";
import { getSupabase } from "./supabase/client";

export type FormatValidationResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

export type ProfileValidationResult =
  | { ok: true; nickname: string; userId: string }
  | { ok: false; error: string };

const MIN_LENGTH = 2;
const MAX_LENGTH = 12;

export function validateNicknameFormat(input: string): FormatValidationResult {
  const nickname = input.trim();

  if (nickname.length < MIN_LENGTH) {
    return { ok: false, error: `닉네임은 ${MIN_LENGTH}자 이상이어야 합니다.` };
  }

  if (nickname.length > MAX_LENGTH) {
    return { ok: false, error: `닉네임은 ${MAX_LENGTH}자 이하여야 합니다.` };
  }

  if (/\s/.test(nickname)) {
    return { ok: false, error: "닉네임에 공백은 사용할 수 없습니다." };
  }

  return { ok: true, nickname };
}

export function getLoggedInNickname(): string {
  return getProfile()?.nickname ?? "";
}

export function getLoggedInUserId(): string {
  return getProfile()?.userId ?? readUserIdFromStorage();
}

export function isProfileComplete(): boolean {
  return !!getProfile();
}

function applyProfile(userId: string, nickname: string): ProfileValidationResult {
  const cached = getProfile();
  writeUserIdToStorage(userId);
  setProfileCache({ userId, nickname });

  if (cached?.userId !== userId || cached?.nickname !== nickname) {
    emitDataEvent(AUTH_CHANGED_EVENT);
  }

  return { ok: true, nickname, userId };
}

/** 쿠키 + localStorage 기반 세션 동기화 */
export async function syncAuthProfile(): Promise<{
  authenticated: boolean;
  hasProfile: boolean;
}> {
  const state = await getSessionState();
  const cached = getProfile();

  if (!state.authenticated) {
    const hadCache = cached !== null || readUserIdFromStorage().length > 0;
    clearProfileCache();
    clearUserIdFromStorage();
    if (hadCache) {
      emitDataEvent(AUTH_CHANGED_EVENT);
    }
    return { authenticated: false, hasProfile: false };
  }

  writeUserIdToStorage(state.userId);

  if (!state.hasProfile) {
    const hadFullProfile = cached !== null;
    clearProfileCache();
    if (hadFullProfile) {
      emitDataEvent(AUTH_CHANGED_EVENT);
    }
    return { authenticated: true, hasProfile: false };
  }

  if (
    cached?.userId === state.userId &&
    cached?.nickname === state.nickname
  ) {
    return { authenticated: true, hasProfile: true };
  }

  applyProfile(state.userId, state.nickname);
  return { authenticated: true, hasProfile: true };
}

/** 카카오 인증 URL로 직접 이동 (scope 없음) */
export function signInWithKakao(): { ok: true } | { ok: false; error: string } {
  if (!isKakaoConfigured()) {
    return { ok: false, error: "Kakao API key가 설정되지 않았습니다." };
  }

  const url = buildKakaoAuthorizeUrl(window.location.origin);
  window.location.assign(url);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  clearProfileCache();
  clearUserIdFromStorage();

  try {
    await signOutServer();
  } catch {
    // 서버 쿠키 정리 실패는 클라이언트 정리로 계속 진행
  }

  emitDataEvent(AUTH_CHANGED_EVENT);
}

/** Kakao 로그인 후 최초 닉네임 설정 */
export async function registerNickname(
  input: string,
): Promise<ProfileValidationResult> {
  const validation = validateNicknameFormat(input);
  if (!validation.ok) return validation;

  const result = await createUserProfile(validation.nickname);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return applyProfile(result.userId, result.nickname);
}

export async function getParticipantCount(): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_COLUMNS.id, { count: "exact", head: true })
    .not(USER_COLUMNS.nickname, "is", null);

  if (error) return 0;
  return count ?? 0;
}
