"use client";

import { useUserStore } from "@/stores/useUserStore";
import type { Difficulty } from "@/types";
import { GraduationCap, BookOpen, Brain } from "lucide-react";

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
    desc: "高中词汇 · 简单句 · 80-120 词文章",
    color: "text-success",
  },
  {
    key: "intermediate",
    label: "中级",
    icon: GraduationCap,
    desc: "四级词汇 · 复合句 · 150-200 词文章",
    color: "text-primary",
  },
  {
    key: "advanced",
    label: "高级",
    icon: Brain,
    desc: "六级+词汇 · 复杂句式 · 200-300 词文章",
    color: "text-cta",
  },
];

export function LevelSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { profile, setLevel } = useUserStore();

  return (
    <div className={compact ? "" : "terminal-card p-6"}>
      {!compact && (
        <h2
          className="text-xl font-semibold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          选择你的英语等级
        </h2>
      )}
      <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
        {LEVELS.map((lvl) => {
          const isActive = profile.level === lvl.key;
          const Icon = lvl.icon;

          return (
            <button
              key={lvl.key}
              onClick={() => setLevel(lvl.key)}
              className={`terminal-card terminal-card-hover p-4 text-left transition-all duration-200 ${
                isActive
                  ? "ring-2 ring-primary ring-offset-2"
                  : "hover:shadow-terminal-hover"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-5 h-5 ${lvl.color}`} />
                <span
                  className="font-semibold text-sm"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {lvl.label}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {lvl.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
