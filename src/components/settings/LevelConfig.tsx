"use client";

import { useState } from "react";
import { BadgeInfo, Hash, User } from "lucide-react";
import { LevelSelector } from "@/components/home/LevelSelector";
import { useUserStore } from "@/stores/useUserStore";

export function LevelConfig() {
  const { profile, setNickname } = useUserStore();
  const [name, setName] = useState(profile.nickname);
  const [saved, setSaved] = useState(false);
  const trimmedName = name.trim();
  const hasChanges = trimmedName !== profile.nickname;

  const handleSaveName = () => {
    if (!trimmedName) return;
    setNickname(trimmedName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="terminal-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            个人信息
          </h3>
        </div>
        <p className="mb-4 text-sm text-text-muted">
          昵称会作为你的本地使用身份，帮助区分不同设备或不同学习者的记录。
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="nickname"
              className="mb-1.5 block text-sm font-medium text-text-muted"
            >
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="terminal-inset w-full rounded-xl px-4 py-2.5 text-text outline-none transition-all duration-200 focus:ring-2 focus:ring-primary"
              placeholder="输入昵称"
            />
          </div>
          <button
            onClick={handleSaveName}
            disabled={!trimmedName || !hasChanges}
            className="terminal-btn min-h-11 bg-primary/15 px-5 py-2.5 text-sm text-primary disabled:opacity-40"
          >
            {saved ? "已保存" : "保存昵称"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-light">
          <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface px-2.5 py-1">
            当前昵称：{profile.nickname}
          </span>
          {saved && (
            <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-primary/10 px-2.5 py-1 text-primary">
              更改已写入本地设置
            </span>
          )}
        </div>
      </div>

      <div className="terminal-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <BadgeInfo className="h-5 w-5 text-primary" />
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            阅读难度
          </h3>
        </div>
        <p className="mb-4 text-sm text-text-muted">
          修改后会影响之后生成的文章长度、词汇复杂度和解释粒度。
        </p>
        <LevelSelector framed={false} />
      </div>

      <div className="terminal-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            关于应用
          </h3>
        </div>
        <div className="space-y-2 text-sm text-text-muted">
          <p>English Reading Assistant v1.0</p>
          <p>围绕英文单词、文本和图片，提供 OCR、阅读和跟读练习。</p>
          <p className="mt-3 text-xs text-text-light">
            浏览器会尽量在本地处理 OCR 与语音数据，以减少不必要的隐私暴露。
          </p>
        </div>
      </div>
    </div>
  );
}
