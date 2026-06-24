import { fetchUserById, registerUserByNickname } from "@/app/actions/nickname";
import { NICKNAME_CHANGED_EVENT, emitDataEvent } from "./events";
import {
  clearSession,
  getSession,
  readPersistedUserId,
  setSession,
} from "./session";
import { getSupabase } from "./supabase/client";
import {
  USER_COLUMNS,
  USERS_TABLE,
} from "./supabase/users-schema";

export type FormatValidationResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

export type NicknameValidationResult =
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
  return getSession()?.nickname ?? "";
}

export function getLoggedInUserId(): string {
  return getSession()?.userId ?? "";
}

export function isLoggedIn(): boolean {
  return !!getSession();
}

async function loginUser(
  user: { id: string; nickname: string },
): Promise<NicknameValidationResult> {
  await setSession(user.id, user.nickname);
  emitDataEvent(NICKNAME_CHANGED_EVENT);
  return { ok: true, nickname: user.nickname, userId: user.id };
}

/** 쿠키 userId → Supabase users(id, nickname, created_at) 조회 */
export async function restoreSession(): Promise<boolean> {
  const userId = getSession()?.userId ?? (await readPersistedUserId());
  if (!userId) return false;

  const result = await fetchUserById(userId);
  if (!result.ok) {
    await clearSession();
    return false;
  }

  await setSession(result.userId, result.nickname);
  return true;
}

/**
 * 닉네임만 입력해 입장. users.nickname 컬럼에 저장.
 * - 신규 → INSERT { nickname }
 * - 기존 → SELECT … WHERE nickname ILIKE …
 */
export async function registerNickname(
  input: string,
): Promise<NicknameValidationResult> {
  const validation = validateNicknameFormat(input);
  if (!validation.ok) return validation;

  const result = await registerUserByNickname(validation.nickname);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return loginUser({ id: result.userId, nickname: result.nickname });
}

export async function getParticipantCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from(USERS_TABLE)
    .select(USER_COLUMNS.id, { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}
