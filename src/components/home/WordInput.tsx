"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Sparkles, X } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";

const LEVEL_LABELS = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
} as const;

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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSubmit();
  };

  return (
    <section className="terminal-card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta/10">
              <PencilLine className="h-4 w-4 text-cta" />
            </div>
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              输入目标单词
            </h2>
          </div>
          <p className="text-sm text-text-muted">
            围绕单词快速生成一篇可练习的英文短文，并直接进入阅读与跟读流程。
          </p>
        </div>
        <div className="rounded-md border border-[rgba(0,255,65,0.12)] bg-primary/6 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.24em] text-text-light">
            Current Level
          </div>
          <div className="mt-1 text-sm font-semibold text-primary">
            {LEVEL_LABELS[profile.level]}
          </div>
        </div>
      </div>

      <label htmlFor="target-word" className="mb-2 block text-sm text-text-muted">
        输入一个英文单词，按 Enter 或点击右侧按钮开始。
      </label>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            id="target-word"
            type="text"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="例如 bank, spring, run, light"
            className={`terminal-inset w-full px-4 py-3 pr-24 text-[15px] text-text outline-none transition-all duration-200 ${
              focused ? "ring-2 ring-cta/40" : ""
            }`}
          />
          {word.trim() && (
            <div className="absolute inset-y-0 right-3 flex items-center gap-2">
              <span className="text-xs text-text-light">
                {LEVEL_LABELS[profile.level]}
              </span>
              <button
                type="button"
                onClick={() => setWord("")}
                aria-label="清空输入"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-light transition-colors hover:bg-surface hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!word.trim()}
          className="terminal-btn flex min-h-12 items-center justify-center gap-2 bg-cta/15 px-5 py-3 text-cta disabled:opacity-50 sm:min-w-40"
        >
          <Sparkles className="h-4 w-4" />
          <span className="whitespace-nowrap font-medium">生成练习文章</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-light">试试这些高频多义词：</span>
        {["bank", "spring", "run", "set", "light"].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setWord(suggestion);
              router.push(
                `/reader/direct/word?word=${encodeURIComponent(suggestion)}&level=${profile.level}`
              );
            }}
            className="rounded-md bg-surface-alt px-2.5 py-1 text-xs text-text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-primary"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
