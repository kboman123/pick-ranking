import { NextResponse } from "next/server";
import { LOGIN_PATH } from "@/lib/auth-routes";

/** Supabase Provider OAuth 콜백 — 카카오는 /auth/kakao/callback 사용 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
}
