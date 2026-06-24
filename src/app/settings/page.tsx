"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, UserRound } from "lucide-react";
import { LevelConfig } from "@/components/settings/LevelConfig";
import { useUserStore } from "@/stores/useUserStore";

export default function SettingsPage() {
  const router = useRouter();
  const { profile } = useUserStore();

  const levelLabel =
    profile.level === "beginner"
      ? "初级"
      : profile.level === "intermediate"
        ? "中级"
        : "高级";

  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => router.push("/")}
          className="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>

        <section className="terminal-card scanline overflow-hidden p-6">
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
              Settings
            </p>
            <h1
              className="mt-2 text-2xl font-bold text-text md:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              个性化设置
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">
              在这里调整昵称和阅读难度，让生成内容更贴近你的学习节奏。
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-text-light">
              <span className="inline-flex items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                <UserRound className="h-3.5 w-3.5 text-primary" />
                当前昵称：{profile.nickname}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                当前难度：{levelLabel}
              </span>
            </div>
          </div>
        </section>

        <LevelConfig />
      </div>
    </div>
  );
}
