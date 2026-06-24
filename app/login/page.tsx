import { Suspense } from "react";
import LoginPageContent from "@/components/LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] text-[#8b9cb3]">
          확인 중…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
