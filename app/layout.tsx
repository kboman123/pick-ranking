import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NicknameProvider from "@/components/NicknameProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "안유픽랭킹",
  description: "스포츠 픽 적중률 랭킹 — 분석가들의 픽 실적을 한눈에 확인하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NicknameProvider>{children}</NicknameProvider>
      </body>
    </html>
  );
}
