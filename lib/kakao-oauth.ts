function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export const KAKAO_REDIRECT_URI =
  "https://pick-ranking.vercel.app/auth/kakao/callback";

const EXPECTED_KAKAO_REDIRECT_URI =
  "https://pick-ranking.vercel.app/auth/kakao/callback";

function logRedirectUriCheck(phase: "authorize" | "token", redirectUri: string): void {
  console.log(`[kakao-oauth] ${phase} redirect_uri:`, redirectUri);
  console.log(`[kakao-oauth] ${phase} redirect_uri match:`, {
    expected: EXPECTED_KAKAO_REDIRECT_URI,
    actual: redirectUri,
    equal: redirectUri === EXPECTED_KAKAO_REDIRECT_URI,
  });
}

export function getKakaoRestApiKey(): string {
  return cleanEnvValue(process.env.KAKAO_REST_API_KEY);
}

export function getKakaoClientSecret(): string {
  return cleanEnvValue(process.env.KAKAO_CLIENT_SECRET);
}

export function isKakaoConfigured(): boolean {
  return (
    getKakaoRestApiKey().length > 0 && getKakaoClientSecret().length > 0
  );
}

/** scope 파라미터 없음 */
export function buildKakaoAuthorizeUrl(): string {
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", getKakaoRestApiKey());
  url.searchParams.set("redirect_uri", KAKAO_REDIRECT_URI);
  url.searchParams.set("response_type", "code");

  logRedirectUriCheck("authorize", url.searchParams.get("redirect_uri") ?? "");

  return url.toString();
}

export async function exchangeKakaoCode(
  code: string,
): Promise<{ accessToken: string } | { error: string }> {
  const clientId = getKakaoRestApiKey();
  if (!clientId) {
    return { error: "Kakao REST API key가 설정되지 않았습니다." };
  }

  const clientSecret = getKakaoClientSecret();
  if (!clientSecret) {
    return { error: "Kakao Client Secret이 설정되지 않았습니다." };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: KAKAO_REDIRECT_URI,
    code,
    client_secret: clientSecret,
  });

  logRedirectUriCheck("token", KAKAO_REDIRECT_URI);
  console.log("[kakao-oauth] token body:", {
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: KAKAO_REDIRECT_URI,
    code: `${code.slice(0, 8)}...`,
    client_secret: `${clientSecret.slice(0, 4)}...`,
    client_secret_present: true,
  });

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
