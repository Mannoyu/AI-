"use client";

import { useRouter } from "next/navigation";
import { FileText, ArrowRight, RefreshCw } from "lucide-react";
import type { ReadingMaterial } from "@/types";

interface OCRResultPreviewProps {
  reader: ReadingMaterial;
  onRetry: () => void;
}

export function OCRResultPreview({ reader, onRetry }: OCRResultPreviewProps) {
  const router = useRouter();

  const previewText =
    reader.ocrText.length > 200
      ? reader.ocrText.slice(0, 200) + "..."
      : reader.ocrText;

  const handleEnterReader = () => {
    router.push(`/reader/${reader.id}`);
  };

  return (
    <div className="terminal-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xl font-semibold flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <FileText className="w-5 h-5 text-primary" />
          识别结果
        </h2>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors duration-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重新识别
        </button>
      </div>

      {/* Reading Material Card */}
      <div className="terminal-inset rounded-2xl p-5 mb-4">
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {reader.title}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
          {previewText}
        </p>
        <p className="text-xs text-text-light mt-3">
          {reader.ocrText.split(/\s+/).length} 个单词 · 识别时间:{" "}
          {new Date(reader.createdAt).toLocaleString("zh-CN")}
        </p>
      </div>

      {/* Enter Reader Button */}
      <button
        onClick={handleEnterReader}
        className="terminal-btn w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary/15 text-primary"
      >
        <span className="font-medium">进入阅读</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
