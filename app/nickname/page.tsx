"use client";

import { useRouter } from "next/navigation";
import NicknameSetupForm from "@/components/NicknameSetupForm";
import { useAuth } from "@/hooks/useAuth";

export default function NicknamePage() {
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSuccess() {
    await refresh();
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-8">
      <NicknameSetupForm onSuccess={() => void handleSuccess()} />
    </main>
  );
}
