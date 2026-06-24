const sizeClass = "h-7 w-7 sm:h-8 sm:w-8";

export default function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/20 text-xs font-bold text-yellow-400 sm:text-sm ${sizeClass}`}
      >
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-400/30 bg-zinc-400/20 text-xs font-bold text-zinc-300 sm:text-sm ${sizeClass}`}
      >
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-700/30 bg-amber-700/20 text-xs font-bold text-amber-500 sm:text-sm ${sizeClass}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-[#1e2a3a] bg-[#1e2a3a80] text-xs font-bold text-[#8b9cb3] sm:text-sm ${sizeClass}`}
    >
      {rank}
    </span>
  );
}
