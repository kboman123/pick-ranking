"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server-ssr";
import { getSupabaseTableErrorMessage } from "@/lib/supabase/errors";
import { getSupabaseServer } from "@/lib/supabase/server-admin";
import {
  USER_COLUMNS,
  USER_SELECT,
  USERS_TABLE,
  toUserInsert,
  type UserRow,
} from "@/lib/supabase/users-schema";

export type ProfileActionResult =
  | { ok: true; userId: string; nickname: string }
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

/** Auth user id로 users 프로필 조회 */
export async function fetchUserProfileByAuthId(
  authUserId: string,
): Promise<ProfileActionResult> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(USER_SELECT)
    .eq(USER_COLUMNS.id, authUserId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error:
        getSupabaseTableErrorMessage(error, USERS_TABLE) ?? error.message,
    };
  }

  if (!data) {
    return { ok: false, error: "PROFILE_NOT_FOUND" };
  }

  return { ok: true, userId: data.id, nickname: data.nickname };
}

/** 카카오 로그인 후 최초 닉네임 등록 (auth user id = users.id) */
export async function createUserProfile(
  nickname: string,
): Promise<ProfileActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const trimmed = nickname.trim();

  const existingProfile = await fetchUserProfileByAuthId(user.id);
  if (existingProfile.ok) {
    return existingProfile;
  }

  const nicknameTaken = await findUserByNickname(trimmed);
  if (nicknameTaken.error) {
    return { ok: false, error: nicknameTaken.error };
  }
  if (nicknameTaken.data && nicknameTaken.data.id !== user.id) {
    return { ok: false, error: "이미 사용 중인 닉네임입니다." };
  }

  const db = getSupabaseServer();
  if (!db) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data: created, error: insertError } = await db
    .from(USERS_TABLE)
    .insert(toUserInsert(user.id, trimmed))
    .select(USER_SELECT)
    .single();

  if (!insertError && created) {
    return {
      ok: true,
      userId: created.id,
      nickname: created.nickname,
    };
  }

  if (insertError?.code === "23505") {
    const raced = await fetchUserProfileByAuthId(user.id);
    if (raced.ok) return raced;
    return { ok: false, error: "이미 사용 중인 닉네임입니다." };
  }

  return {
    ok: false,
    error:
      getSupabaseTableErrorMessage(insertError, USERS_TABLE) ??
      insertError?.message ??
      "닉네임 등록에 실패했습니다.",
  };
}
