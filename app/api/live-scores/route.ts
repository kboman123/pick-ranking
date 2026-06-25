import { NextResponse } from "next/server";

/**
 * Phase 3: 클라이언트 polling 폐기 — Supabase Realtime 사용
 * 이 엔드포인트는 더 이상 브라우저에서 호출하지 않습니다.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Deprecated in Phase 3. Use Supabase Realtime on games table instead.",
    },
    { status: 410 },
  );
}
