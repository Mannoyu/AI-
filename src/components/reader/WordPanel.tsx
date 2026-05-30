"use client";

import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
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

  const handleGenerateArticle = () => {
    router.push(`/reader/${readerId}/word?word=${encodeURIComponent(word)}&level=${profile.level}`);
  };

  const difficultyInfo: Record<Difficulty, { label: string; desc: string }> =
    {
      beginner: { label: "初级", desc: "简单句 · 80-120 词" },
      intermediate: { label: "中级", desc: "复合句 · 150-200 词" },
      advanced: { label: "高级", desc: "复杂句 · 200-300 词" },
    };

  const info = difficultyInfo[profile.level];

  return (
    <div className={`terminal-card p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          选中单词
        </h3>
      </div>

      {/* Word Display */}
      <div className="terminal-inset rounded-xl p-4 mb-4 text-center">
        <p className="text-3xl font-bold text-primary mb-1">{word}</p>
        <p className="text-xs text-text-muted">
          全文 {wordCount} 词 · 难度 {info.label}
        </p>
      </div>

      {/* Difficulty Info */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-surface-alt">
        <Sparkles className="w-4 h-4 text-cta flex-shrink-0" />
        <p className="text-xs text-text-muted leading-relaxed">
          AI 将根据<strong>{info.label}</strong>等级（{info.desc}）生成一篇围绕此单词的多语义文章
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateArticle}
        className="terminal-btn w-full flex items-center justify-center gap-2 px-5 py-3 bg-cta/15 text-cta"
      >
        <span className="font-medium">生成学习文章</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
