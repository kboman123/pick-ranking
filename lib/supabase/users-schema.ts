import type { DbUser } from "./database.types";

/** public.users — kakao_id + nickname */
export const USERS_TABLE = "users" as const;

export const USER_COLUMNS = {
  id: "id",
  kakao_id: "kakao_id",
  nickname: "nickname",
  created_at: "created_at",
} as const;

export const USER_SELECT =
  `${USER_COLUMNS.id}, ${USER_COLUMNS.kakao_id}, ${USER_COLUMNS.nickname}, ${USER_COLUMNS.created_at}` as const;

export type UserRow = Pick<
  DbUser,
  "id" | "kakao_id" | "nickname" | "created_at"
>;

export type KakaoUserInsert = {
  [USER_COLUMNS.kakao_id]: string;
};

export function toKakaoUserInsert(kakaoId: string): KakaoUserInsert {
  return {
    [USER_COLUMNS.kakao_id]: kakaoId,
  };
}
