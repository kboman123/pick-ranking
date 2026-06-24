-- policies.sql 적용 여부 확인용 (SQL Editor에서 Run)

-- users RLS 정책 목록 (select/insert/update/delete 4개 있어야 함)
SELECT
  tablename,
  policyname,
  cmd AS operation,
  roles,
  permissive,
  qual AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'games', 'predictions')
ORDER BY tablename, cmd;

-- users GRANT 목록 (anon/authenticated에 INSERT 있어야 함)
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- RLS 활성화 여부
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE nspname = 'public'
  AND relname IN ('users', 'games', 'predictions');
