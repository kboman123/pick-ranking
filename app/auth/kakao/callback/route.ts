import { NextResponse } from "next/server";
import { fetchUserProfileByAuthId } from "@/app/actions/user-profile";
import { LOGIN_PATH, NICKNAME_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import { createSupabaseSessionFromKakaoId } from "@/lib/kakao-auth-server";
import {
  exchangeKakaoCode,
  fetchKakaoUserId,
  isKakaoOAuthConfigured,
} from "@/lib/kakao-oauth";
import { createServerSupabaseClient } from "@/lib/supabase/server-ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const kakaoError = searchParams.get("error");
  const kakaoErrorDescription = searchParams.get("error_description");

  if (kakaoError) {
    logAuthRedirect("kakao-callback-error", LOGIN_PATH, {
      error: kakaoError,
      description: kakaoErrorDescription,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(kakaoErrorDescription ?? kakaoError)}`,
    );
  }

  if (!code) {
    logAuthRedirect("kakao-callback-no-code", LOGIN_PATH);
    return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
  }

  if (!isKakaoOAuthConfigured()) {
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("카카오 OAuth 설정이 없습니다.")}`,
    );
  }

  const tokenResult = await exchangeKakaoCode(code, origin);
  if ("error" in tokenResult) {
    logAuthRedirect("kakao-token-error", LOGIN_PATH, { error: tokenResult.error });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(tokenResult.error)}`,
    );
  }

  const userResult = await fetchKakaoUserId(tokenResult.accessToken);
  if ("error" in userResult) {
    logAuthRedirect("kakao-user-error", LOGIN_PATH, { error: userResult.error });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(userResult.error)}`,
    );
  }

  const sessionResult = await createSupabaseSessionFromKakaoId(userResult.kakaoId);
  if ("error" in sessionResult) {
    logAuthRedirect("kakao-session-error", LOGIN_PATH, {
      error: sessionResult.error,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(sessionResult.error)}`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: sessionResult.hashedToken,
  });

  if (verifyError) {
    logAuthRedirect("kakao-verify-error", LOGIN_PATH, {
      error: verifyError.message,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(verifyError.message)}`,
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    logAuthRedirect("kakao-no-session-after-verify", LOGIN_PATH);
    return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
  }

  const profile = await fetchUserProfileByAuthId(session.user.id);
  const destination = profile.ok ? "/" : NICKNAME_PATH;

  logAuthRedirect("kakao-callback-success", destination, {
    kakaoId: userResult.kakaoId,
    hasProfile: profile.ok,
  });

  return NextResponse.redirect(`${origin}${destination}`);
}
