"use server";

import { persistUserIdCookie } from "@/app/actions/session";
import { getSupabaseTableErrorMessage } from "@/lib/supabase/errors";
import { getSupabaseServer } from "@/lib/supabase/server-admin";
import {
  USER_COLUMNS,
  USER_SELECT,
  USERS_TABLE,
  toUserInsert,
  type UserRow,
} from "@/lib/supabase/users-schema";

export type NicknameActionResult =
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
        getSupabaseTableErrorMessage(error, USERS_TABLE) ??
        error.message,
    };
  }

  return { data, error: null };
}

/** 닉네임으로 users 조회 또는 nickname 컬럼에 INSERT */
export async function registerUserByNickname(
  nickname: string,
): Promise<NicknameActionResult> {
  const trimmed = nickname.trim();

  const existing = await findUserByNickname(trimmed);
  if (existing.error) {
    return { ok: false, error: existing.error };
  }
  if (existing.data) {
    await persistUserIdCookie(existing.data.id);
    return {
      ok: true,
      userId: existing.data.id,
      nickname: existing.data.nickname,
    };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: "Supabase 서버 설정이 없습니다." };
  }

  const { data: created, error: insertError } = await supabase
    .from(USERS_TABLE)
    .insert(toUserInsert(trimmed))
    .select(USER_SELECT)
    .single();

  if (!insertError && created) {
    await persistUserIdCookie(created.id);
    return {
      ok: true,
      userId: created.id,
      nickname: created.nickname,
    };
  }

  if (insertError?.code === "23505") {
    const raced = await findUserByNickname(trimmed);
    if (raced.error) {
      return { ok: false, error: raced.error };
    }
    if (raced.data) {
      await persistUserIdCookie(raced.data.id);
      return {
        ok: true,
        userId: raced.data.id,
        nickname: raced.data.nickname,
      };
    }
  }

  if (insertError?.code === "42703") {
    return {
      ok: false,
      error:
        `users 테이블에 \`${USER_COLUMNS.nickname}\` 컬럼이 없습니다. ` +
        "SQL Editor에서 supabase/migrations/add_users_nickname.sql을 실행해 주세요.",
    };
  }

  return {
    ok: false,
    error:
      getSupabaseTableErrorMessage(insertError, USERS_TABLE) ??
      insertError?.message ??
      "닉네임 등록에 실패했습니다.",
  };
}

export async function fetchUserById(
  userId: string,
): Promise<NicknameActionResult> {
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
    return { ok: false, error: "사용자를 찾을 수 없습니다." };
  }

  return { ok: true, userId: data.id, nickname: data.nickname };
}
