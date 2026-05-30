"use client";

import { useUserStore } from "@/stores/useUserStore";
import { LevelSelector } from "@/components/home/LevelSelector";
import { User, Mail, Hash } from "lucide-react";
import { useState } from "react";

export function LevelConfig() {
  const { profile, setNickname } = useUserStore();
  const [name, setName] = useState(profile.nickname);
  const [saved, setSaved] = useState(false);

  const handleSaveName = () => {
    setNickname(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Nickname */}
      <div className="terminal-card p-6">
        <h3
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <User className="w-5 h-5 text-primary" />
          个人信息
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-text-muted mb-1.5"
            >
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="terminal-inset w-full px-4 py-2.5 text-text rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="输入昵称"
            />
          </div>
          <button
            onClick={handleSaveName}
            className="terminal-btn px-5 py-2.5 bg-primary/15 text-primary text-sm"
          >
            {saved ? "已保存 ✓" : "保存"}
          </button>
        </div>
      </div>

      {/* Level */}
      <LevelSelector />

      {/* App Info */}
      <div className="terminal-card p-6">
        <h3
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Hash className="w-5 h-5 text-primary" />
          关于
        </h3>
        <div className="text-sm text-text-muted space-y-1.5">
          <p>English Reading Assistant v1.0</p>
          <p>AI 英语朗读助手 — 拍照识别 + 多义文章 + 跟读练习</p>
          <p className="text-xs text-text-light mt-3">
            浏览器本地处理 OCR 与语音，保护隐私。
          </p>
        </div>
      </div>
    </div>
  );
}
