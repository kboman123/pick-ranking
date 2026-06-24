import type { DbUser } from "./database.types";

/** public.users — id = Supabase Auth user id, nickname, created_at */
export const USERS_TABLE = "users" as const;

export const USER_COLUMNS = {
  id: "id",
  nickname: "nickname",
  created_at: "created_at",
} as const;

export const USER_SELECT =
  `${USER_COLUMNS.id}, ${USER_COLUMNS.nickname}, ${USER_COLUMNS.created_at}` as const;

export type UserRow = Pick<DbUser, "id" | "nickname" | "created_at">;

export type UserInsert = {
  [USER_COLUMNS.id]: string;
  [USER_COLUMNS.nickname]: string;
};

export function toUserInsert(authUserId: string, nickname: string): UserInsert {
  return {
    [USER_COLUMNS.id]: authUserId,
    [USER_COLUMNS.nickname]: nickname,
  };
}
