const ENV_URL = "NEXT_PUBLIC_SUPABASE_URL";
const ENV_PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const ENV_LEGACY_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function cleanEnvValue(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = cleanEnvValue(process.env[ENV_URL]);
  const publishableKey = cleanEnvValue(
    process.env[ENV_PUBLISHABLE_KEY] ?? process.env[ENV_LEGACY_ANON_KEY],
  );

  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, publishableKey } = getSupabaseEnv();
  return url.length > 0 && publishableKey.length > 0;
}

export function getSupabaseEnvErrorMessage(): string {
  const url = cleanEnvValue(process.env[ENV_URL]);
  const publishableKey = cleanEnvValue(
    process.env[ENV_PUBLISHABLE_KEY] ?? process.env[ENV_LEGACY_ANON_KEY],
  );
  const hasLegacyAnon = cleanEnvValue(process.env[ENV_LEGACY_ANON_KEY]).length > 0;
  const hasPublishable = cleanEnvValue(process.env[ENV_PUBLISHABLE_KEY]).length > 0;

  const missing: string[] = [];
  if (!url) missing.push(ENV_URL);
  if (!publishableKey) {
    missing.push(ENV_PUBLISHABLE_KEY);
  }

  let message =
    "Supabase 환경변수가 설정되지 않았습니다. pick-ranking/.env.local 파일을 확인해 주세요.";

  if (missing.length > 0) {
    message += `\n누락: ${missing.join(", ")}`;
  }

  if (!publishableKey && hasLegacyAnon && !hasPublishable) {
    message += `\n${ENV_LEGACY_ANON_KEY} 값은 감지됐지만, ${ENV_PUBLISHABLE_KEY} 이름으로 설정하는 것을 권장합니다.`;
  }

  message +=
    "\n값 입력 후 개발 서버를 재시작하세요. (npm run dev)" +
    "\n실행 위치: pick-ranking 프로젝트 루트";

  return message;
}

export function getEnvVariableNamesForDisplay(): string[] {
  return [ENV_URL, ENV_PUBLISHABLE_KEY];
}
