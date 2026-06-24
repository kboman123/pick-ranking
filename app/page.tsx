import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HomeStats from "@/components/HomeStats";
import RankingPreview from "@/components/RankingPreview";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Sports Pick Ranking
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            스포츠 픽 랭킹
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            예측하고 결과를 확인하세요. 실제 예측 · 결과 데이터로 적중률
            랭킹이 집계됩니다.
          </p>
        </section>

        <HomeStats />

        <RankingPreview />

        <p className="mt-6 text-center text-xs text-[#8b9cb3] sm:mt-8">
          * 랭킹은 Supabase의 예측 · 결과 데이터를 기반으로 표시됩니다.
        </p>
      </main>

      <Footer />
    </div>
  );
}
