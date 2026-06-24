-- =============================================================================
-- Kakao OAuth + Auth user id 연동
-- schema.sql 실행 후, Supabase Dashboard에서 Kakao Provider 활성화 필요
-- Authentication → Providers → Kakao
-- Redirect URL: https://<project>.supabase.co/auth/v1/callback
-- Site URL / Redirect URLs에 http://localhost:3000/auth/callback 추가
-- =============================================================================

-- 1. uid 컬럼 제거 (auth user id = users.id)
DROP INDEX IF EXISTS public.users_uid_unique;
ALTER TABLE public.users DROP COLUMN IF EXISTS uid;

-- 2. users.id → auth.users.id FK (기존 랜덤 id row가 있으면 FK 추가 전 정리 필요)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 기존 닉네임-only 데이터가 있다면 수동 마이그레이션 후 실행하세요.
-- ALTER TABLE public.users
--   ADD CONSTRAINT users_id_fkey
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON TABLE public.users IS 'Supabase Auth user id + 표시용 nickname';
COMMENT ON COLUMN public.users.id IS 'auth.users.id 와 동일';

-- 3. users RLS — 본인 프로필만 INSERT
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname); END LOOP;
END $$;

CREATE POLICY "users_select" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. predictions RLS — 본인 예측만 INSERT/UPDATE
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'predictions'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.predictions', pol.policyname); END LOOP;
END $$;

CREATE POLICY "predictions_select" ON public.predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_delete" ON public.predictions FOR DELETE TO authenticated USING (auth.uid() = user_id);
