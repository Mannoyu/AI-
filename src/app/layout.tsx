import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-body-fallback",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "English Reading Assistant — AI 英语朗读助手",
  description:
    "拍照识别英文文本，点击单词生成多语义文章，AI 跟读练习，轻松提升英语阅读能力",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${jetbrainsMono.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex items-start justify-center p-3 md:p-5"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {/* Soft page frame — gentle terminal feel */}
        <div className="w-full max-w-5xl min-h-[96vh] flex flex-col page-frame bg-bg">
          <Navbar />
          <main className="flex-1 flex flex-col relative z-10 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
