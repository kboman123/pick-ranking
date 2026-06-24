import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MatchManager from "@/components/MatchManager";

export default function MatchesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Matches
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            경기
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            등록된 KBO · MLB · NPB 경기 일정입니다. 관리자는 경기 등록 · 수정 ·
            삭제가 가능합니다.
          </p>
        </section>

        <MatchManager />

        <p className="mt-6 text-center text-xs text-[#8b9cb3] sm:mt-8">
          * 경기 데이터는 Supabase games 테이블에 저장됩니다.
        </p>
      </main>

      <Footer />
    </div>
  );
}
