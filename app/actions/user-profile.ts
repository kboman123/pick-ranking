"use server";

import { readUserIdCookie } from "@/app/actions/user-session";
import { getSupabaseTableErrorMessage } from "@/lib/supabase/errors";
import { getSupabaseServer } from "@/lib/supabase/server-admin";
import {
  USER_COLUMNS,
  USER_SELECT,
  USERS_TABLE,
  toKakaoUserInsert,
  type UserRow,
} from "@/lib/supabase/users-schema";

export type ProfileActionResult =
  | { ok: true; userId: string; nickname: string }
  | { ok: false; error: string };

export type UserLookupResult =
  | { ok: true; userId: string; kakaoId: string; nickname: string | null }
  | { ok: false; error: string };

async function findUserByNickname(
  nickname: string,
): Promise<{ data: UserRow | null; error: string | null }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { data: null, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .ilike(USER_COLUMNS.nickname, nickname)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error:
        getSupabaseTableErrorMessage(error, USERS_TABLE) ?? error.message,
    };
  }

  return { data, error: null };
}

function toLookup(row: UserRow): UserLookupResult {
  if (!row.kakao_id) {
    return { ok: false, error: "INVALID_USER_ROW" };
  }

  return {
    ok: true,
    userId: row.id,
    kakaoId: row.kakao_id,
    nickname: row.nickname,
  };
}

export async function fetchUserById(
  userId: string,
): Promise<UserLookupResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .eq(USER_COLUMNS.id, userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error:
        getSupabaseTableErrorMessage(error, USERS_TABLE) ?? error.message,
    };
  }

  if (!data) {
    return { ok: false, error: "USER_NOT_FOUND" };
  }

  return toLookup(data);
}

export async function fetchUserByKakaoId(
  kakaoId: string,
): Promise<UserLookupResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .eq(USER_COLUMNS.kakao_id, kakaoId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error:
        getSupabaseTableErrorMessage(error, USERS_TABLE) ?? error.message,
    };
  }

  if (!data) {
    return { ok: false, error: "USER_NOT_FOUND" };
  }

  return toLookup(data);
}

export async function upsertUserByKakaoId(
  kakaoId: string,
): Promise<UserLookupResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .insert(toKakaoUserInsert(kakaoId))
    .select(USER_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await fetchUserByKakaoId(kakaoId);
      if (existing.ok) return existing;
    }

    return {
      ok: false,
      error:
        getSupabaseTableErrorMessage(error, USERS_TABLE) ?? error.message,
    };
  }

  return toLookup(data);
}

/** Kakao 로그인 후 최초 닉네임 등록 (쿠키 user_id 기준) */
export async function createUserProfile(
  nickname: string,
): Promise<ProfileActionResult> {
  const userId = await readUserIdCookie();
  if (!userId) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const trimmed = nickname.trim();
  const current = await fetchUserById(userId);

  if (!current.ok) {
    return { ok: false, error: "사용자 정보를 찾을 수 없습니다." };
  }

  if (current.nickname && current.nickname.trim().length > 0) {
    return {
      ok: true,
      userId: current.userId,
      nickname: current.nickname,
    };
  }

  const nicknameTaken = await findUserByNickname(trimmed);
  if (nicknameTaken.error) {
    return { ok: false, error: nicknameTaken.error };
  }
  if (nicknameTaken.data && nicknameTaken.data.id !== userId) {
    return { ok: false, error: "이미 사용 중인 닉네임입니다." };
  }

  const db = getSupabaseServer();
  if (!db) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data: updated, error: updateError } = await db
    .from(USERS_TABLE)
    .update({ [USER_COLUMNS.nickname]: trimmed })
    .eq(USER_COLUMNS.id, userId)
    .is(USER_COLUMNS.nickname, null)
    .select(USER_SELECT)
    .maybeSingle();

  if (!updateError && updated?.nickname) {
    return {
      ok: true,
      userId: updated.id,
      nickname: updated.nickname,
    };
  }

  if (updateError?.code === "23505") {
    return { ok: false, error: "이미 사용 중인 닉네임입니다." };
  }

  const raced = await fetchUserById(userId);
  if (raced.ok && raced.nickname) {
    return {
      ok: true,
      userId: raced.userId,
      nickname: raced.nickname,
    };
  }

  return {
    ok: false,
    error:
      getSupabaseTableErrorMessage(updateError, USERS_TABLE) ??
      updateError?.message ??
      "닉네임 등록에 실패했습니다.",
  };
}
