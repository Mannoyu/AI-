"use client";

import { LevelConfig } from "@/components/settings/LevelConfig";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <h1
          className="text-2xl font-bold text-text mb-6"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          设置
        </h1>

        <LevelConfig />
      </div>
    </div>
  );
}
