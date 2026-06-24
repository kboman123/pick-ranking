function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getKakaoOAuthEnv() {
  return {
    clientId: cleanEnvValue(process.env.KAKAO_REST_API_KEY),
    clientSecret: cleanEnvValue(process.env.KAKAO_CLIENT_SECRET),
  };
}

export function isKakaoOAuthConfigured(): boolean {
  return getKakaoOAuthEnv().clientId.length > 0;
}

/** Supabase Auth용 내부 식별 이메일 (카카오에서 이메일 요청하지 않음) */
export function kakaoAuthEmail(kakaoId: string | number): string {
  return `kakao.${kakaoId}@auth.pick-ranking.local`;
}

/**
 * Kakao authorize URL — scope 파라미터 없음
 * (account_email / profile_image / profile_nickname 미요청)
 */
export function buildKakaoAuthorizeUrl(origin: string): string {
  const { clientId } = getKakaoOAuthEnv();
  const redirectUri = `${origin}/auth/kakao/callback`;

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeKakaoCode(
  code: string,
  origin: string,
): Promise<{ accessToken: string } | { error: string }> {
  const { clientId, clientSecret } = getKakaoOAuthEnv();
  const redirectUri = `${origin}/auth/kakao/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    return {
      error:
        payload.error_description ??
        payload.error ??
        "카카오 토큰 교환에 실패했습니다.",
    };
  }

  return { accessToken: payload.access_token };
}

/** scope 없이도 id만 반환 (프로필/이메일 필드 요청 없음) */
export async function fetchKakaoUserId(
  accessToken: string,
): Promise<{ kakaoId: string } | { error: string }> {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  const payload = (await response.json()) as {
    id?: number;
    msg?: string;
  };

  if (!response.ok || payload.id == null) {
    return {
      error: payload.msg ?? "카카오 사용자 ID를 가져오지 못했습니다.",
    };
  }

  return { kakaoId: String(payload.id) };
}
