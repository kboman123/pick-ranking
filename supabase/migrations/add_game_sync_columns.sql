-- =============================================================================
-- API-SPORTS 경기 결과 동기화용 컬럼 (games = 앱의 matches)
-- SQL Editor에서 실행
-- =============================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS home_score integer,
  ADD COLUMN IF NOT EXISTS away_score integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Scheduled',
  ADD COLUMN IF NOT EXISTS status_detail text,
  ADD COLUMN IF NOT EXISTS api_sports_game_id integer,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

COMMENT ON COLUMN public.games.result IS 'game_result — home=홈팀 승, away=원정팀 승';
COMMENT ON COLUMN public.games.home_score IS 'API-SPORTS 동기화 홈팀 득점';
COMMENT ON COLUMN public.games.away_score IS 'API-SPORTS 동기화 원정팀 득점';
COMMENT ON COLUMN public.games.status IS 'Scheduled | Live | Finished | Postponed | Cancelled 등';
COMMENT ON COLUMN public.games.api_sports_game_id IS 'API-SPORTS game id (매칭 후 저장)';

CREATE UNIQUE INDEX IF NOT EXISTS games_api_sports_game_id_unique
  ON public.games (api_sports_game_id)
  WHERE api_sports_game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS games_status_scheduled_idx
  ON public.games (status, scheduled_at);

-- predictions 적중 여부 캐시 (경기 종료 시 result-sync가 계산)
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS is_hit boolean,
  ADD COLUMN IF NOT EXISTS evaluated_at timestamptz;

COMMENT ON COLUMN public.predictions.is_hit IS '경기 종료 후 pick = games.result 이면 true';
COMMENT ON COLUMN public.predictions.evaluated_at IS '적중 여부 계산 시각';
