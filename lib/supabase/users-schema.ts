import { randomUUID } from "crypto";
import type { DbUser } from "./database.types";

/** public.users — id, uid, nickname, created_at */
export const USERS_TABLE = "users" as const;

export const USER_COLUMNS = {
  id: "id",
  uid: "uid",
  nickname: "nickname",
  created_at: "created_at",
} as const;

export const USER_SELECT =
  `${USER_COLUMNS.id}, ${USER_COLUMNS.uid}, ${USER_COLUMNS.nickname}, ${USER_COLUMNS.created_at}` as const;

export type UserRow = Pick<DbUser, "id" | "uid" | "nickname" | "created_at">;

export type UserInsert = {
  [USER_COLUMNS.uid]: string;
  [USER_COLUMNS.nickname]: string;
};

export function toUserInsert(nickname: string): UserInsert {
  return {
    [USER_COLUMNS.uid]: randomUUID(),
    [USER_COLUMNS.nickname]: nickname,
  };
}
