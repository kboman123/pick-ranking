import { getSupabaseAdmin } from "@/lib/supabase/server-admin";
import { kakaoAuthEmail } from "@/lib/kakao-oauth";

/**
 * 카카오 id → Supabase Auth 세션 (이메일/프로필 scope 없이)
 * users.id = auth.users.id, 닉네임은 /nickname에서 별도 등록
 */
export async function createSupabaseSessionFromKakaoId(
  kakaoId: string,
): Promise<{ hashedToken: string } | { error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." };
  }

  const email = kakaoAuthEmail(kakaoId);

  let linkResult = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkResult.error?.message?.includes("User not found")) {
    const createResult = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        kakao_id: kakaoId,
        provider: "kakao",
      },
    });

    if (
      createResult.error &&
      !createResult.error.message.toLowerCase().includes("already")
    ) {
      return { error: createResult.error.message };
    }

    linkResult = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  }

  if (linkResult.error || !linkResult.data.properties.hashed_token) {
    return {
      error: linkResult.error?.message ?? "Supabase 세션 생성에 실패했습니다.",
    };
  }

  return { hashedToken: linkResult.data.properties.hashed_token };
}
