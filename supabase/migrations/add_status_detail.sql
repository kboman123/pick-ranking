-- LIVE 이닝 / (추후) 축구 경기시간 등 표시용
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS status_detail text;

COMMENT ON COLUMN public.games.status_detail IS 'Live: 이닝(7회 등). Soccer 확장: 경기시간(45'' 등)';
