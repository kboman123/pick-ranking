import { signOutServer } from "@/app/actions/auth";
import { createUserProfile } from "@/app/actions/user-profile";
import { fetchUserProfileByAuthId } from "@/app/actions/user-profile";
import { AUTH_CHANGED_EVENT, emitDataEvent } from "./events";
import {
  clearProfileCache,
  getProfile,
  setProfileCache,
} from "./session";
import {
  createBrowserSupabaseClient,
  resetBrowserSupabaseClient,
} from "./supabase/browser";
import {
  USER_COLUMNS,
  USERS_TABLE,
} from "./supabase/users-schema";

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
  return getProfile()?.userId ?? "";
}

export function isProfileComplete(): boolean {
  return !!getProfile();
}

function applyProfile(userId: string, nickname: string): ProfileValidationResult {
  const cached = getProfile();
  setProfileCache({ userId, nickname });

  if (cached?.userId !== userId || cached?.nickname !== nickname) {
    emitDataEvent(AUTH_CHANGED_EVENT);
  }

  return { ok: true, nickname, userId };
}

/** Supabase Auth 세션 + users 프로필 동기화 (이벤트는 상태 변경 시에만) */
export async function syncAuthProfile(): Promise<{
  authenticated: boolean;
  hasProfile: boolean;
}> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const cached = getProfile();

  if (!session?.user) {
    const hadCache = cached !== null;
    clearProfileCache();
    if (hadCache) {
      emitDataEvent(AUTH_CHANGED_EVENT);
    }
    return { authenticated: false, hasProfile: false };
  }

  const result = await fetchUserProfileByAuthId(session.user.id);
  if (!result.ok) {
    const hadCache = cached !== null;
    clearProfileCache();
    if (hadCache) {
      emitDataEvent(AUTH_CHANGED_EVENT);
    }
    return { authenticated: true, hasProfile: false };
  }

  if (
    cached?.userId === result.userId &&
    cached?.nickname === result.nickname
  ) {
    return { authenticated: true, hasProfile: true };
  }

  applyProfile(result.userId, result.nickname);
  return { authenticated: true, hasProfile: true };
}

export async function signInWithKakao(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 로그인할 수 있습니다." };
  }

  window.location.assign("/auth/kakao/start");
  return { ok: true };
}

/** 브라우저 저장소 + 레거시 닉네임 입장 흔적 제거 */
function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // private mode 등에서 실패할 수 있음
  }
}

export async function signOut(): Promise<void> {
  const supabase = createBrowserSupabaseClient();

  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    // 세션 없음 등
  }

  clearProfileCache();
  clearLegacyAuthStorage();
  resetBrowserSupabaseClient();

  try {
    await signOutServer();
  } catch {
    // 서버 쿠키 정리 실패는 클라이언트 정리로 계속 진행
  }

  emitDataEvent(AUTH_CHANGED_EVENT);
}

/** 카카오 로그인 후 최초 닉네임 설정 */
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
  const supabase = createBrowserSupabaseClient();
  const { count, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_COLUMNS.id, { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}
