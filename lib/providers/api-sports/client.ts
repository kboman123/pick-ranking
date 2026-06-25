const BASE_URL = "https://v1.baseball.api-sports.io";

type ApiResponse<T> = {
  errors: Record<string, string> | string[];
  results: number;
  response: T;
};

function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getApiSportsKey(): string | null {
  const key = cleanEnvValue(process.env.API_BASEBALL_KEY);
  return key.length > 0 ? key : null;
}

export function isApiSportsConfigured(): boolean {
  return getApiSportsKey() !== null;
}

export async function fetchApiSports<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  const apiKey = getApiSportsKey();
  if (!apiKey) {
    throw new Error("API_BASEBALL_KEY 환경변수가 설정되지 않았습니다.");
  }

  const url = new URL(`${BASE_URL}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`API-SPORTS 요청 실패 (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  const errors = payload.errors;
  if (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors ?? {}).length > 0) {
    const message = Array.isArray(errors)
      ? errors.join(", ")
      : Object.values(errors).join(", ");
    throw new Error(`API-SPORTS 오류: ${message}`);
  }

  return payload.response;
}

export function currentSeasonYear(): number {
  return new Date().getFullYear();
}
