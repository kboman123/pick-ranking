"use server";

import { clearUserIdCookie } from "@/app/actions/user-session";

/** 사용자 세션 쿠키 제거 */
export async function signOutServer(): Promise<void> {
  await clearUserIdCookie();
}
