function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getKakaoClientId(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY);
}

export function getKakaoClientSecret(): string {
  return cleanEnvValue(process.env.KAKAO_CLIENT_SECRET);
}

/** Production: https://pick-ranking.vercel.app/auth/kakao/callback */
export function getKakaoRedirectUri(origin?: string): string {
  const fromEnv = cleanEnvValue(process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI);
  if (fromEnv) return fromEnv;
  if (origin) return `${origin}/auth/kakao/callback`;
  return "https://pick-ranking.vercel.app/auth/kakao/callback";
}

export function isKakaoConfigured(): boolean {
  return getKakaoClientId().length > 0;
}

/** scope 파라미터 없음 */
export function buildKakaoAuthorizeUrl(origin?: string): string {
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", getKakaoClientId());
  url.searchParams.set("redirect_uri", getKakaoRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeKakaoCode(
  code: string,
  origin?: string,
): Promise<{ accessToken: string } | { error: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getKakaoClientId(),
    redirect_uri: getKakaoRedirectUri(origin),
    code,
  });

  const secret = getKakaoClientSecret();
  if (secret) {
    body.set("client_secret", secret);
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

/** id만 사용 — scope/profile/email 요청 없음 */
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
