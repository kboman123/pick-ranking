import type { PostgrestError } from "@supabase/supabase-js";

export function getSupabaseTableErrorMessage(
  error: PostgrestError | null,
  table: string,
): string | null {
  if (!error) return null;

  switch (error.code) {
    case "PGRST205":
      return `Supabase에 \`${table}\` 테이블이 없습니다. Dashboard → SQL Editor에서 supabase/schema.sql을 실행해 주세요.`;
    case "42501":
      return `\`${table}\` 테이블 INSERT/UPDATE가 거부되었습니다. SQL Editor에서 supabase/policies.sql을 실행해 GRANT와 RLS 정책을 적용해 주세요. (확인: supabase/verify-policies.sql)`;
    case "42703":
      return `\`${table}\` 테이블 컬럼명이 코드와 다릅니다. users는 id, nickname, created_at 구조여야 합니다. (${error.message})`;
    case "23505":
      return null;
    default:
      return `\`${table}\` 테이블 요청 실패 (${error.code ?? "unknown"}): ${error.message}`;
  }
}
