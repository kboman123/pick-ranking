import type { MatchOpinion } from "@/lib/opinion";

type MatchOpinionBarProps = {
  homeTeam: string;
  awayTeam: string;
  opinion: MatchOpinion | undefined;
};

export default function MatchOpinionBar({
  homeTeam,
  awayTeam,
  opinion,
}: MatchOpinionBarProps) {
  const total = opinion?.total ?? 0;
  const homePercent = opinion?.homePercent ?? 0;
  const awayPercent = opinion?.awayPercent ?? 0;
  const homeCount = opinion?.homeCount ?? 0;
  const awayCount = opinion?.awayCount ?? 0;

  if (total === 0) {
    return (
      <p className="mt-1.5 text-[10px] text-[#8b9cb3] sm:mt-4 sm:rounded-xl sm:border sm:border-[#1e2a3a] sm:bg-[#0b0f14] sm:px-4 sm:py-3 sm:text-xs">
        📊 참여자 없음 · 첫 예측을 남겨보세요
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-[#1e2a3a] bg-[#0b0f14] px-3 py-2 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3">
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
        <p className="text-[10px] font-semibold tracking-wide text-[#8b9cb3] sm:text-xs">
          📊 회원 여론
        </p>
        <p className="text-[10px] text-[#8b9cb3] sm:text-xs">
          {total > 0 ? `총 ${total}명 참여` : "참여자 없음"}
        </p>
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[#1e2a3a] sm:h-2">
            <div
              className="bg-[#00d4aa] transition-all duration-500"
              style={{ width: `${homePercent}%` }}
            />
            <div
              className="bg-[#3d4f66] transition-all duration-500"
              style={{ width: `${awayPercent}%` }}
            />
          </div>

          <div className="mt-2 flex flex-col gap-1 sm:mt-3 sm:gap-2 md:flex-row md:justify-between">
            <p className="min-w-0 text-[11px] text-[#e8edf4] sm:text-sm">
              <span className="font-semibold text-[#00d4aa] break-words">
                {homeTeam}
              </span>{" "}
              승{" "}
              <span className="font-bold text-[#00d4aa]">{homePercent}%</span>
              <span className="text-[#8b9cb3]"> ({homeCount}명)</span>
            </p>
            <p className="min-w-0 text-[11px] text-[#e8edf4] sm:text-sm md:text-right">
              <span className="font-semibold break-words">{awayTeam}</span> 승{" "}
              <span className="font-bold">{awayPercent}%</span>
              <span className="text-[#8b9cb3]"> ({awayCount}명)</span>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
