-- Phase 3: games 테이블 Realtime publication
-- Supabase Dashboard → Database → Publications → supabase_realtime 에서 확인
-- SQL Editor에서 실행 (이미 추가된 경우 duplicate_object 무시)

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.games IS '경기 일정·Live/Finished/Cancelled/Postponed·점수 (Realtime publication)';
