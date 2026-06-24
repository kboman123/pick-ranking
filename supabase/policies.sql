-- =============================================================================
-- pick-ranking — RLS + GRANT (publishable / anon key)
-- schema.sql, add_users_nickname.sql 실행 후 이 파일을 SQL Editor에서 Run
--
-- 증상: SELECT는 되는데 INSERT/UPDATE 42501
-- 원인: INSERT 정책 또는 GRANT INSERT 누락
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 스키마 / 테이블 권한 (RLS와 별개로 필수)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.games TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.predictions TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. RLS 활성화
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. users — 기존 정책 전부 제거 후 재생성
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "users_select"
  ON public.users
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "users_insert"
  ON public.users
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "users_update"
  ON public.users
  AS PERMISSIVE
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_delete"
  ON public.users
  AS PERMISSIVE
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 4. games
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'games'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.games', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "games_select"
  ON public.games AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "games_insert"
  ON public.games AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "games_update"
  ON public.games AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "games_delete"
  ON public.games AS PERMISSIVE FOR DELETE TO anon, authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 5. predictions
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'predictions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.predictions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "predictions_select"
  ON public.predictions AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "predictions_insert"
  ON public.predictions AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "predictions_update"
  ON public.predictions AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "predictions_delete"
  ON public.predictions AS PERMISSIVE FOR DELETE TO anon, authenticated USING (true);

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- 6. 적용 확인 (아래 SELECT 결과를 Table Editor에서 확인)
-- -----------------------------------------------------------------------------
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'users'
-- ORDER BY policyname;
--
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name = 'users'
--   AND grantee IN ('anon', 'authenticated')
-- ORDER BY grantee, privilege_type;
