import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ResultManager from "@/components/ResultManager";

export default function ResultsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Results
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            결과
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            경기 결과와 내 예측 적중/미적중을 확인하세요. 관리자는 결과 입력 ·
            수정이 가능합니다.
          </p>
        </section>

        <ResultManager />

        <p className="mt-6 text-center text-xs text-[#8b9cb3] sm:mt-8">
          * 결과는 Supabase games.result 컬럼에 저장됩니다.
        </p>
      </main>

      <Footer />
    </div>
  );
}
