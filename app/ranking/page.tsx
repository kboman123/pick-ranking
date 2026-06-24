import Footer from "@/components/Footer";
import RankingBoard from "@/components/RankingBoard";

export default function RankingPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Ranking
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            랭킹
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            주간·월간 랭킹을 운영합니다. 기간별로 등록된 경기와
            예측(created_at)을 기준으로 집계하며, 데이터는 삭제하지 않습니다.
          </p>
        </section>

        <RankingBoard />

        <p className="mt-6 text-center text-xs text-[#8b9cb3] sm:mt-8">
          * created_at 기준 기간별 집계 · 주간=월요일 00:00 KST · 월간=1일
          00:00 KST
        </p>
      </main>

      <Footer />
    </>
  );
}
