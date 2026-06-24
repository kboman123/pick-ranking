import { NextResponse } from "next/server";
import { fetchUserByKakaoId, upsertUserByKakaoId } from "@/app/actions/user-profile";
import { LOGIN_PATH, NICKNAME_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import {
  exchangeKakaoCode,
  fetchKakaoUserId,
  isKakaoConfigured,
} from "@/lib/kakao-oauth";
import { USER_ID_COOKIE } from "@/lib/user-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const kakaoError = searchParams.get("error");
  const kakaoErrorDescription = searchParams.get("error_description");

  if (kakaoError) {
    const message =
      kakaoErrorDescription ?? kakaoError ?? "카카오 로그인에 실패했습니다.";
    logAuthRedirect("kakao-callback-oauth-error", LOGIN_PATH, {
      error: message,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(message)}`,
    );
  }

  if (!isKakaoConfigured()) {
    logAuthRedirect("kakao-callback-not-configured", LOGIN_PATH);
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("Kakao API key가 설정되지 않았습니다.")}`,
    );
  }

  if (!code) {
    logAuthRedirect("kakao-callback-no-code", LOGIN_PATH);
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent("인증 코드가 없습니다.")}`,
    );
  }

  const tokenResult = await exchangeKakaoCode(code);
  if ("error" in tokenResult) {
    logAuthRedirect("kakao-callback-token-error", LOGIN_PATH, {
      error: tokenResult.error,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(tokenResult.error)}`,
    );
  }

  const idResult = await fetchKakaoUserId(tokenResult.accessToken);
  if ("error" in idResult) {
    logAuthRedirect("kakao-callback-user-error", LOGIN_PATH, {
      error: idResult.error,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(idResult.error)}`,
    );
  }

  let user = await fetchUserByKakaoId(idResult.kakaoId);
  if (!user.ok) {
    user = await upsertUserByKakaoId(idResult.kakaoId);
  }

  if (!user.ok) {
    logAuthRedirect("kakao-callback-db-error", LOGIN_PATH, {
      error: user.error,
    });
    return NextResponse.redirect(
      `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(user.error)}`,
    );
  }

  const hasProfile = Boolean(user.nickname && user.nickname.trim().length > 0);
  const destination = hasProfile ? "/" : NICKNAME_PATH;

  logAuthRedirect("kakao-callback-success", destination, {
    userId: user.userId,
    kakaoId: idResult.kakaoId,
    hasProfile,
  });

  const response = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.set(USER_ID_COOKIE, user.userId, cookieOptions);
  return response;
}
