import Footer from "@/components/Footer";
import PredictionForm from "@/components/PredictionForm";

export default function PredictPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <section className="mb-4 sm:mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#00d4aa] sm:mb-2 sm:text-sm">
            Predict
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            예측하기
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#8b9cb3] sm:mt-3 sm:text-base">
            경기 시작 시간(KST) 전까지 승자를 예측할 수 있습니다. 시작된
            경기는 결과 페이지에서 확인하세요.
          </p>
        </section>

        <PredictionForm />

        <p className="mt-6 text-center text-xs text-[#8b9cb3] sm:mt-8">
          * 예측 데이터는 Supabase에 저장됩니다.
        </p>
      </main>

      <Footer />
    </>
  );
}
