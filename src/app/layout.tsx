import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Reading Assistant",
  description:
    "拍照识别英文内容，生成练习文章，并通过跟读训练提升阅读与发音表现。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body
        className="min-h-full flex items-start justify-center p-3 md:p-5"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        <div className="w-full max-w-6xl min-h-[96vh] flex flex-col page-frame bg-bg">
          <Navbar />
          <main className="relative z-10 flex flex-1 flex-col overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
