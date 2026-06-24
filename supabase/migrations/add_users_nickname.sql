-- =============================================================================
-- users 테이블 컬럼 추가: nickname, created_at
-- (기존 id, uid 유지)
-- Supabase SQL Editor에 붙여넣고 Run
-- =============================================================================

-- uid 컬럼이 없으면 추가 (이미 있으면 건너뜀)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS uid text;

-- nickname, created_at 추가
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 기존 행 보정
UPDATE public.users
SET created_at = now()
WHERE created_at IS NULL;

UPDATE public.users
SET uid = id::text
WHERE uid IS NULL AND id IS NOT NULL;

ALTER TABLE public.users
  ALTER COLUMN created_at SET DEFAULT now();

-- 닉네임 형식 (2~12자, 공백 불가)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_nickname_format;
ALTER TABLE public.users ADD CONSTRAINT users_nickname_format CHECK (
  nickname IS NULL OR (
    char_length(nickname) BETWEEN 2 AND 12
    AND nickname = btrim(nickname)
    AND nickname !~ '\s'
  )
);

-- uid / nickname 유니크
CREATE UNIQUE INDEX IF NOT EXISTS users_uid_unique
  ON public.users (uid)
  WHERE uid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_lower_unique
  ON public.users (lower(nickname))
  WHERE nickname IS NOT NULL;

COMMENT ON COLUMN public.users.uid IS '외부 식별자 (입장 시 자동 생성)';
COMMENT ON COLUMN public.users.nickname IS '2~12자, 공백 불가. lower() 유니크';

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
