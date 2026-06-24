import PromoBanners from "@/components/PromoBanners";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#1e2a3a]">
      <div className="py-6 sm:py-10">
        <PromoBanners />
      </div>
      <div className="border-t border-[#1e2a3a] py-4 text-center text-xs text-[#8b9cb3] sm:py-6 sm:text-sm">
        © 2026 픽랭킹 — Sports Pick Ranking
      </div>
    </footer>
  );
}
