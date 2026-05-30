"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LevelSelector } from "@/components/home/LevelSelector";
import { ImageUploader } from "@/components/home/ImageUploader";
import { WordInput } from "@/components/home/WordInput";
import { OCRResultPreview } from "@/components/home/OCRResultPreview";
import { useReaderStore } from "@/stores/useReaderStore";
import { useUserStore } from "@/stores/useUserStore";
import { Sparkles, ArrowRight, AlertTriangle, FileText } from "lucide-react";
import type { ReadingMaterial } from "@/types";
import { recognizeImage, type OcrProgress } from "@/lib/ocr";

export default function HomePage() {
  const router = useRouter();
  const { isFirstVisit, markVisited } = useUserStore();
  const {
    currentReader,
    ocrLoading,
    ocrError,
    setReader,
    setOcrLoading,
    setOcrError,
  } = useReaderStore();
  const [ocrStatus, setOcrStatus] = useState<string>("");

  const handleImage = useCallback(
    async (file: File, dataUrl: string) => {
      setOcrLoading(true);
      setOcrError(null);
      setOcrStatus("正在加载识别引擎...");

      try {
        const text = await recognizeImage(dataUrl, (progress: OcrProgress) => {
          // Show meaningful status messages during OCR
          if (progress.status === "loading tesseract core") {
            setOcrStatus("正在加载 OCR 引擎...");
          } else if (progress.status === "initializing tesseract") {
            setOcrStatus("正在初始化...");
          } else if (progress.status === "loading language traineddata") {
            setOcrStatus("正在加载英语语言包...");
          } else if (progress.status === "recognizing text") {
            const pct = Math.round(progress.progress * 100);
            setOcrStatus(`正在识别文字... ${pct}%`);
          }
        });

        if (!text) {
          setOcrError("未能识别到文字，请确认图片中包含清晰的英文文本");
          return;
        }

        // Generate a title from the first line or first few words
        const firstLine = text.split("\n").find((l) => l.trim().length > 0) || "";
        const title =
          firstLine.length > 60
            ? firstLine.slice(0, 60) + "..."
            : firstLine || "Untitled";

        const result: ReadingMaterial = {
          id: `r_${Date.now()}`,
          title,
          ocrText: text,
          createdAt: new Date().toISOString(),
          imageDataUrl: dataUrl,
        };
        setReader(result);
        markVisited();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "OCR 识别失败";
        console.error("OCR error:", err);
        setOcrError(`文字识别失败: ${message}`);
      }
    },
    [setOcrLoading, setOcrError, setReader, markVisited]
  );

  const handleRetry = useCallback(() => {
    setOcrLoading(false);
    window.location.reload();
  }, [setOcrLoading]);

  const handlePasteText = useCallback(
    (text: string) => {
      const firstLine =
        text.split("\n").find((l) => l.trim().length > 0) || "";
      const title =
        firstLine.length > 60
          ? firstLine.slice(0, 60) + "..."
          : firstLine || "Untitled";

      const result: ReadingMaterial = {
        id: `r_${Date.now()}`,
        title,
        ocrText: text,
        createdAt: new Date().toISOString(),
      };
      setReader(result);
      markVisited();
    },
    [setReader, markVisited]
  );

  // First visit — show level selector
  if (isFirstVisit && !currentReader) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-terminal">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1
              className="text-2xl font-bold text-text mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              AI 英语朗读助手
            </h1>
            <p className="text-text-muted text-sm">
              拍照识别英文文本，或直接输入单词，AI 生成多语义文章，跟读练习发音
            </p>
          </div>

          <LevelSelector />

          <div className="terminal-inset rounded-2xl p-4">
            <WordInput />
          </div>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(0,255,65,0.10)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-bg text-xs text-text-light">
                或者
              </span>
            </div>
          </div>

          <button
            onClick={markVisited}
            className="terminal-btn w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary/15 text-primary"
          >
            <span className="font-medium">拍照上传文本</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-text"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              AI 英语朗读助手
            </h1>
            <p className="text-text-muted text-sm mt-1">
              输入单词或上传图片，开始学习
            </p>
          </div>
          <button
            onClick={() => router.push("/history")}
            className="text-sm text-text-muted hover:text-primary transition-colors"
          >
            查看历史 →
          </button>
        </div>

        {/* Word Input — always visible */}
        <WordInput />

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(0,255,65,0.10)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-bg text-xs text-text-light">
              或者上传图片 / 粘贴文本
            </span>
          </div>
        </div>

        {/* Paste Text */}
        {!currentReader && <PasteTextSection onText={handlePasteText} />}

        {/* Upload */}
        {!currentReader && (
          <ImageUploader onImage={handleImage} loading={ocrLoading} />
        )}

        {/* OCR Loading State */}
        {ocrLoading && (
          <div className="terminal-card p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted text-sm">{ocrStatus}</p>
            <p className="text-xs text-text-light">
              首次加载需要下载英语语言包（约 4MB），请耐心等待
            </p>
          </div>
        )}

        {/* OCR Error */}
        {ocrError && !ocrLoading && (
          <div className="terminal-inset rounded-2xl p-4 flex items-start gap-3 border border-error/20 bg-error/5">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-error mb-1">识别失败</p>
              <p className="text-xs text-text-muted">{ocrError}</p>
            </div>
          </div>
        )}

        {/* OCR Result */}
        {currentReader && (
          <OCRResultPreview reader={currentReader} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}

/** Inline component: paste English text to enter the reader directly. */
function PasteTextSection({ onText }: { onText: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="terminal-card p-5 w-full text-center hover:border-primary/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">
            或者直接粘贴英文文本 → 进入读者页面（测试 AI 朗读）
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="terminal-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          粘贴英文文本
        </h2>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴任意英文文本，然后点击下方按钮进入读者页面，使用 AI 朗读功能..."
        rows={6}
        className="terminal-inset w-full rounded-xl p-4 text-text text-sm resize-y outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => {
            if (text.trim()) onText(text.trim());
          }}
          disabled={!text.trim()}
          className="terminal-btn flex items-center gap-2 px-5 py-2.5 bg-primary/15 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="font-medium text-sm">进入阅读</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
