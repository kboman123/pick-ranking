import AdminPanel from "@/components/AdminPanel";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f14] text-[#e8edf4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 text-center sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            관리자
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            경기 등록과 결과 입력은 관리자만 이용할 수 있습니다.
          </p>
        </section>

        <AdminPanel />
      </main>

      <Footer />
    </div>
  );
}
