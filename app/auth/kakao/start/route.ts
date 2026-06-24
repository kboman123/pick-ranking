import { NextResponse } from "next/server";
import {
  buildKakaoAuthorizeUrl,
  getKakaoOAuthEnv,
  isKakaoOAuthConfigured,
} from "@/lib/kakao-oauth";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isKakaoOAuthConfigured()) {
    logAuthRedirect("kakao-start-missing-env", LOGIN_PATH);
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("KAKAO_REST_API_KEY가 설정되지 않았습니다.")}`,
    );
  }

  const authorizeUrl = buildKakaoAuthorizeUrl(origin);
  const redirectUri = `${origin}/auth/kakao/callback`;
  const { clientId } = getKakaoOAuthEnv();

  console.info("[kakao-oauth] /auth/kakao/start", {
    origin,
    redirectUri,
    clientIdPrefix: clientId ? `${clientId.slice(0, 6)}…` : "(missing)",
    KAKAO_REST_API_KEY_configured: Boolean(clientId),
    authorizeUrl,
    scopes: "none",
  });

  logAuthRedirect("kakao-start", authorizeUrl, {
    scopes: "none",
    redirectUri,
    clientIdConfigured: Boolean(clientId),
  });

  return NextResponse.redirect(authorizeUrl);
}
