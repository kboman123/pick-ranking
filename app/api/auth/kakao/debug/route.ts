import { NextResponse } from "next/server";
import { getKakaoOAuthEnv, isKakaoOAuthConfigured } from "@/lib/kakao-oauth";

/** 배포 환경 OAuth 설정 진단 (비밀값 미노출) */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const { clientId, clientSecret } = getKakaoOAuthEnv();
  const redirectUri = `${origin}/auth/kakao/callback`;

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId || "(missing)");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");

  return NextResponse.json({
    flow: "direct-kakao-oauth",
    note: "signInWithOAuth({ provider: 'kakao' })는 사용하지 않습니다. scope 미요청.",
    supabaseSignInWithOAuth: null,
    redirectTo: redirectUri,
    redirectUri,
    origin,
    startPath: "/auth/kakao/start",
    callbackPath: "/auth/kakao/callback",
    scopes: [],
    env: {
      KAKAO_REST_API_KEY: clientId
        ? { configured: true, prefix: `${clientId.slice(0, 6)}…`, length: clientId.length }
        : { configured: false },
      KAKAO_CLIENT_SECRET: clientSecret
        ? { configured: true, length: clientSecret.length }
        : { configured: false },
    },
    authorizeUrl: authorizeUrl.toString(),
    kakaoConsoleHint:
      "Kakao Developers → 앱 → 플랫폼 → Redirect URI에 위 redirectUri 값을 정확히 등록하세요.",
  });
}
