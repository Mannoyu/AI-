"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { PencilLine, ArrowRight, Sparkles } from "lucide-react";

export function WordInput() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [word, setWord] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    const trimmed = word.trim();
    if (!trimmed) return;
    router.push(
      `/reader/direct/word?word=${encodeURIComponent(trimmed)}&level=${profile.level}`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="terminal-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center">
          <PencilLine className="w-4 h-4 text-cta" />
        </div>
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          直接输入单词
        </h2>
      </div>

      <p className="text-sm text-text-muted mb-4">
        输入一个你想学习的英语单词，AI 将生成一篇包含该单词多种语义的文章
      </p>

      {/* Input Row */}
      <div
        className={`flex items-stretch gap-0 transition-all duration-200 ${
          focused ? "scale-[1.01]" : ""
        }`}
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="输入单词，如 bank、spring、run..."
            className="terminal-inset w-full h-full px-4 py-3 text-text rounded-l-2xl outline-none focus:ring-2 focus:ring-cta/40 transition-all duration-200 text-[15px]"
          />
          {word.trim() && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-light">
              {profile.level === "beginner"
                ? "初级"
                : profile.level === "intermediate"
                  ? "中级"
                  : "高级"}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!word.trim()}
          className="terminal-btn flex items-center gap-2 px-5 py-3 bg-cta/15 text-cta rounded-l-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-medium whitespace-nowrap">生成文章</span>
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs text-text-light">试试：</span>
        {["bank", "spring", "run", "set", "light"].map((w) => (
          <button
            key={w}
            onClick={() => {
              setWord(w);
              router.push(
                `/reader/direct/word?word=${encodeURIComponent(w)}&level=${profile.level}`
              );
            }}
            className="text-xs px-2.5 py-1 rounded-lg bg-surface-alt text-text-muted hover:bg-primary/10 hover:text-primary transition-colors duration-150"
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
