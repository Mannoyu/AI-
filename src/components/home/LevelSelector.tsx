"use client";

import { BookOpen, Brain, GraduationCap } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import type { Difficulty } from "@/types";

const LEVELS: {
  key: Difficulty;
  label: string;
  icon: typeof GraduationCap;
  desc: string;
  color: string;
}[] = [
  {
    key: "beginner",
    label: "初级",
    icon: BookOpen,
    desc: "适合基础巩固，词汇和句式更直接，文章长度更短。",
    color: "text-success",
  },
  {
    key: "intermediate",
    label: "中级",
    icon: GraduationCap,
    desc: "适合日常训练，兼顾常用词汇、复合句和语义理解。",
    color: "text-primary",
  },
  {
    key: "advanced",
    label: "高级",
    icon: Brain,
    desc: "适合进阶阅读，句式更复杂，文章更接近真实材料。",
    color: "text-cta",
  },
];

export function LevelSelector({
  compact = false,
  framed = true,
}: {
  compact?: boolean;
  framed?: boolean;
}) {
  const { profile, setLevel } = useUserStore();

  return (
    <div className={framed ? "terminal-card p-6" : ""}>
      {!compact && (
        <div className="mb-4">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            选择阅读难度
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            这个等级会影响生成文章的长度、词汇密度和解释方式。
          </p>
        </div>
      )}
      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {LEVELS.map((level) => {
          const isActive = profile.level === level.key;
          const Icon = level.icon;

          return (
            <button
              key={level.key}
              onClick={() => setLevel(level.key)}
              aria-pressed={isActive}
              className={`terminal-card terminal-card-hover min-h-32 p-4 text-left transition-all duration-200 ${
                isActive
                  ? "bg-primary/6 ring-2 ring-primary ring-offset-2"
                  : "hover:shadow-terminal-hover"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${level.color}`} />
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {level.label}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] ${
                    isActive ? "text-primary" : "text-text-light"
                  }`}
                >
                  {isActive ? "Selected" : "Option"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-text-muted">
                {level.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
