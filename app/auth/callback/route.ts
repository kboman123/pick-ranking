import { NextResponse } from "next/server";
import { LOGIN_PATH } from "@/lib/auth-routes";

/** 레거시 Supabase Auth callback — 직접 Kakao OAuth로 대체됨 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(
    `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("카카오 로그인 방식이 변경되었습니다. 다시 로그인해 주세요.")}`,
  );
}
