"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FileText, RefreshCw } from "lucide-react";
import type { ReadingMaterial } from "@/types";

interface OCRResultPreviewProps {
  reader: ReadingMaterial;
  onRetry: () => void;
}

export function OCRResultPreview({ reader, onRetry }: OCRResultPreviewProps) {
  const router = useRouter();

  const previewText =
    reader.ocrText.length > 200
      ? `${reader.ocrText.slice(0, 200)}...`
      : reader.ocrText;
  const wordCount = reader.ocrText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="terminal-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="flex items-center gap-2 text-xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <FileText className="h-5 w-5 text-primary" />
            识别结果
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            已生成可阅读文本，确认无误后即可进入阅读器。
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:bg-surface hover:text-text"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          重新识别
        </button>
      </div>

      <div className="terminal-inset mb-4 rounded-2xl p-5">
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {reader.title}
        </h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
          {previewText}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-light">
          <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface px-2.5 py-1">
            约 {wordCount} 词
          </span>
          <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface px-2.5 py-1">
            识别时间 {new Date(reader.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
      </div>

      <button
        onClick={() => router.push(`/reader/${reader.id}`)}
        className="terminal-btn flex min-h-12 w-full items-center justify-center gap-2 bg-primary/15 px-6 py-3 text-primary"
      >
        <span className="font-medium">进入阅读器</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
