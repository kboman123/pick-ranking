"use server";

import { cookies } from "next/headers";
import { USER_ID_COOKIE } from "@/lib/user-session";
import { fetchUserById } from "@/app/actions/user-profile";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function persistUserIdCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(USER_ID_COOKIE, userId, cookieOptions);
}

export async function readUserIdCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(USER_ID_COOKIE)?.value;
  return value && value.length > 0 ? value : null;
}

export async function clearUserIdCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_ID_COOKIE);
}

export async function getSessionState(): Promise<{
  authenticated: boolean;
  hasProfile: boolean;
  userId: string;
  nickname: string;
  kakaoId: string;
}> {
  const userId = await readUserIdCookie();
  if (!userId) {
    return {
      authenticated: false,
      hasProfile: false,
      userId: "",
      nickname: "",
      kakaoId: "",
    };
  }

  const user = await fetchUserById(userId);
  if (!user.ok) {
    await clearUserIdCookie();
    return {
      authenticated: false,
      hasProfile: false,
      userId: "",
      nickname: "",
      kakaoId: "",
    };
  }

  const hasProfile = Boolean(user.nickname && user.nickname.trim().length > 0);

  return {
    authenticated: true,
    hasProfile,
    userId: user.userId,
    nickname: user.nickname ?? "",
    kakaoId: user.kakaoId,
  };
}

export async function clearUserSession(): Promise<void> {
  await clearUserIdCookie();
}
