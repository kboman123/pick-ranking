import { NextResponse } from "next/server";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { buildKakaoAuthorizeUrl, isKakaoConfigured } from "@/lib/kakao-oauth";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isKakaoConfigured()) {
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("Kakao REST API key가 설정되지 않았습니다.")}`,
    );
  }

  return NextResponse.redirect(buildKakaoAuthorizeUrl());
}
