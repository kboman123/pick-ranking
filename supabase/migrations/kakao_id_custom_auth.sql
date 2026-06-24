-- Kakao 직접 OAuth + kakao_id 기반 로그인 (Supabase Auth 미사용)
-- SQL Editor에서 Run

-- auth.users FK 제거, id 자동 생성
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- kakao_id 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id text;

CREATE UNIQUE INDEX IF NOT EXISTS users_kakao_id_unique
  ON public.users (kakao_id)
  WHERE kakao_id IS NOT NULL;

-- 닉네임 설정 전 NULL 허용
ALTER TABLE public.users ALTER COLUMN nickname DROP NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_nickname_format;
ALTER TABLE public.users ADD CONSTRAINT users_nickname_format CHECK (
  nickname IS NULL OR (
    char_length(nickname) BETWEEN 2 AND 12
    AND nickname = btrim(nickname)
    AND nickname !~ '\s'
  )
);

COMMENT ON TABLE public.users IS 'Kakao kakao_id + 표시용 nickname';
COMMENT ON COLUMN public.users.id IS '앱 내부 uuid (predictions.user_id)';
COMMENT ON COLUMN public.users.kakao_id IS 'Kakao numeric user id (unique)';
