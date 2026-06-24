"use server";

import { cookies } from "next/headers";

const USER_ID_COOKIE = "pick-ranking-user-id";
const ADMIN_COOKIE = "pick-ranking-admin";

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
  return store.get(USER_ID_COOKIE)?.value ?? null;
}

export async function clearUserIdCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_ID_COOKIE);
}

export async function persistAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "1", cookieOptions);
}

export async function readAdminCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "1";
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
