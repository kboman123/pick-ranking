-- ranking_view 갱신: 전체 등록 경기 기준 랭킹 점수
-- SQL Editor에서 Run

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

NOTIFY pgrst, 'reload schema';
