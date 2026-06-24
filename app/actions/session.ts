"use server";

import { cookies } from "next/headers";

const ADMIN_COOKIE = "pick-ranking-admin";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

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
