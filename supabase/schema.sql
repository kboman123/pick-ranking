-- =============================================================================
-- pick-ranking (픽랭킹) — Supabase 초기 스키마
-- SQL Editor에 전체 붙여넣은 뒤 Run (한 번 실행)
-- =============================================================================
--
-- [results 테이블 판단]
-- 별도 results 테이블 없이 games.result 컬럼으로 처리합니다.
--
--   games.result        → 관리자가 입력한 승패 (home / away / NULL)
--   games.result_at     → 결과 입력 시각
--   적중/실패/적중률     → predictions + games JOIN 으로 조회 시 계산
--   랭킹                → ranking_view (저장 X, 계산 O)
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum types
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.sport_type AS ENUM ('KBO', 'MLB', 'NPB');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.pick_outcome AS ENUM ('home', 'away');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. users — Kakao kakao_id + nickname
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_id text,
  nickname text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_nickname_format CHECK (
    nickname IS NULL OR (
      char_length(nickname) BETWEEN 2 AND 12
      AND nickname = btrim(nickname)
      AND nickname !~ '\s'
    )
  )
);

COMMENT ON TABLE public.users IS 'Kakao kakao_id + 표시용 nickname';
COMMENT ON COLUMN public.users.id IS '앱 내부 uuid (predictions.user_id)';
COMMENT ON COLUMN public.users.kakao_id IS 'Kakao numeric user id (unique)';

CREATE UNIQUE INDEX IF NOT EXISTS users_kakao_id_unique
  ON public.users (kakao_id)
  WHERE kakao_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_lower_unique
  ON public.users (lower(nickname));

-- -----------------------------------------------------------------------------
-- 3. games — 경기 등록 + 결과 입력
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport public.sport_type NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  scheduled_at timestamptz NOT NULL,

  -- results 테이블 대신 여기에 저장
  result public.pick_outcome,          -- NULL = 결과 미입력
  result_at timestamptz,               -- 관리자 결과 입력 시각

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT games_teams_not_empty CHECK (
    char_length(btrim(home_team)) > 0
    AND char_length(btrim(away_team)) > 0
  ),
  CONSTRAINT games_teams_different CHECK (home_team <> away_team),
  CONSTRAINT games_result_consistency CHECK (
    (result IS NULL AND result_at IS NULL)
    OR (result IS NOT NULL AND result_at IS NOT NULL)
  )
);

COMMENT ON TABLE public.games IS '경기 일정 및 승패 결과';
COMMENT ON COLUMN public.games.result IS 'home=홈팀 승, away=원정팀 승. NULL=미입력';
COMMENT ON COLUMN public.games.result_at IS '결과 입력 시각';

CREATE INDEX IF NOT EXISTS games_scheduled_at_idx
  ON public.games (scheduled_at);

CREATE INDEX IF NOT EXISTS games_sport_scheduled_idx
  ON public.games (sport, scheduled_at);

CREATE INDEX IF NOT EXISTS games_pending_result_idx
  ON public.games (scheduled_at)
  WHERE result IS NULL;

-- -----------------------------------------------------------------------------
-- 4. predictions — 회원 예측 (1인 1경기 1예측, 재제출 UPSERT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games (id) ON DELETE CASCADE,
  pick public.pick_outcome NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT predictions_one_per_user_game UNIQUE (user_id, game_id)
);

COMMENT ON TABLE public.predictions IS '회원별 경기 예측';
COMMENT ON COLUMN public.predictions.pick IS 'home=홈팀 승 예측, away=원정팀 승 예측';

CREATE INDEX IF NOT EXISTS predictions_game_id_idx
  ON public.predictions (game_id);

CREATE INDEX IF NOT EXISTS predictions_user_id_idx
  ON public.predictions (user_id);

CREATE INDEX IF NOT EXISTS predictions_submitted_at_idx
  ON public.predictions (submitted_at DESC);

-- -----------------------------------------------------------------------------
-- 5. updated_at 자동 갱신
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_set_updated_at ON public.games;
CREATE TRIGGER games_set_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS predictions_set_updated_at ON public.predictions;
CREATE TRIGGER predictions_set_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. ranking_view — 랭킹 (전체 등록 경기 기준)
--    점수 = 적중 수 / 전체 등록 경기 수 × 100
--    미참여 = 예측하지 않은 경기 (실패와 별도)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.ranking_view AS
SELECT
  u.id AS user_id,
  u.nickname,
  (SELECT COUNT(*)::int FROM public.games) AS total_games,
  COUNT(DISTINCT p.game_id)::int AS participated,
  COUNT(*) FILTER (WHERE g.result IS NOT NULL AND p.pick = g.result)::int AS hits,
  COUNT(*) FILTER (WHERE g.result IS NOT NULL AND p.pick <> g.result)::int AS misses,
  (
    (SELECT COUNT(*)::int FROM public.games)
    - COUNT(DISTINCT p.game_id)::int
  ) AS non_participation,
  CASE
    WHEN (SELECT COUNT(*) FROM public.games) = 0 THEN 0::numeric
    ELSE ROUND(
      COUNT(*) FILTER (WHERE g.result IS NOT NULL AND p.pick = g.result)::numeric
      / (SELECT COUNT(*)::int FROM public.games)::numeric
      * 1000
    ) / 10
  END AS ranking_score
FROM public.users u
LEFT JOIN public.predictions p ON p.user_id = u.id
LEFT JOIN public.games g ON g.id = p.game_id
GROUP BY u.id, u.nickname
HAVING COUNT(DISTINCT p.game_id) > 0;

COMMENT ON VIEW public.ranking_view IS '전체 등록 경기 대비 적중 점수. 미참여는 실패와 별도 집계';

-- -----------------------------------------------------------------------------
-- 7. game_opinion_view — 여론 (홈/원정 비율)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.game_opinion_view AS
SELECT
  g.id AS game_id,
  COUNT(p.id)::int AS total_predictions,
  COUNT(*) FILTER (WHERE p.pick = 'home')::int AS home_count,
  COUNT(*) FILTER (WHERE p.pick = 'away')::int AS away_count,
  CASE
    WHEN COUNT(p.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE p.pick = 'home')::numeric
      / COUNT(p.id)::numeric * 100
    )::int
  END AS home_percent,
  CASE
    WHEN COUNT(p.id) = 0 THEN 0
    ELSE (
      100 - ROUND(
        COUNT(*) FILTER (WHERE p.pick = 'home')::numeric
        / COUNT(p.id)::numeric * 100
      )::int
    )
  END AS away_percent
FROM public.games g
LEFT JOIN public.predictions p ON p.game_id = g.id
GROUP BY g.id;

COMMENT ON VIEW public.game_opinion_view IS '경기별 회원 예측 비율';

-- -----------------------------------------------------------------------------
-- 8. 랭킹 조회 예시 (실행 불필요, 참고용)
-- -----------------------------------------------------------------------------
-- SELECT
--   ROW_NUMBER() OVER (
--     ORDER BY ranking_score DESC, hits DESC, participated DESC, nickname ASC
--   ) AS rank,
--   *
-- FROM public.ranking_view;
