"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import type { Difficulty } from "@/types";

interface WordPanelProps {
  word: string;
  readerId: string;
  wordCount: number;
  className?: string;
}

export function WordPanel({
  word,
  readerId,
  wordCount,
  className = "",
}: WordPanelProps) {
  const router = useRouter();
  const { profile } = useUserStore();
  const trimmedWord = word.trim();

  const handleGenerateArticle = () => {
    if (!trimmedWord) return;

    router.push(
      `/reader/${readerId}/word?word=${encodeURIComponent(trimmedWord)}&level=${profile.level}`
    );
  };

  const difficultyInfo: Record<Difficulty, { label: string; desc: string }> = {
    beginner: { label: "初级", desc: "简单句 · 80-120 词" },
    intermediate: { label: "中级", desc: "复合句 · 150-200 词" },
    advanced: { label: "高级", desc: "复杂句 · 200-300 词" },
  };

  const info = difficultyInfo[profile.level];

  return (
    <div className={`terminal-card p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            选中单词
          </h3>
          <p className="text-xs text-text-light">从当前阅读材料进入专项练习</p>
        </div>
      </div>

      <div className="terminal-inset mb-4 rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-text-light">
          Selected
        </p>
        <p className="mt-2 break-words text-3xl font-bold text-primary">
          {trimmedWord}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-light">
          <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
            全文 {wordCount} 词
          </span>
          <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
            当前难度 {info.label}
          </span>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/60 p-4 text-sm leading-relaxed text-text-muted">
        <div className="mb-2 flex items-start gap-2 text-text">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-cta" />
          <span className="font-medium">AI 练习将围绕这个单词展开</span>
        </div>
        <p>
          会按照 <strong className="text-text">{info.label}</strong> 难度生成一篇
          多语义文章，正文长度约为 <strong className="text-text">{info.desc}</strong>
          ，并提供逐句跟读入口。
        </p>
      </div>

      <button
        type="button"
        onClick={handleGenerateArticle}
        disabled={!trimmedWord}
        className="terminal-btn flex min-h-12 w-full items-center justify-center gap-2 bg-cta/15 px-5 py-3 text-cta disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="font-medium">生成学习文章</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
