"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { OCRResultPreview } from "@/components/home/OCRResultPreview";
import { ImageUploader } from "@/components/home/ImageUploader";
import { LevelSelector } from "@/components/home/LevelSelector";
import { WordInput } from "@/components/home/WordInput";
import { recognizeImage, type OcrProgress } from "@/lib/ocr";
import { useReaderStore } from "@/stores/useReaderStore";
import { useUserStore } from "@/stores/useUserStore";
import type { ReadingMaterial } from "@/types";

const LEVEL_LABELS = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
} as const;

export default function HomePage() {
  const router = useRouter();
  const { isFirstVisit, markVisited, profile } = useUserStore();
  const {
    hydrated,
    currentReader,
    ocrLoading,
    ocrError,
    clearReader,
    removeReaderById,
    setReader,
    setOcrLoading,
    setOcrError,
  } = useReaderStore();
  const [ocrStatus, setOcrStatus] = useState("");

  const handleImage = useCallback(
    async (_file: File, dataUrl: string) => {
      setOcrLoading(true);
      setOcrError(null);
      setOcrStatus("正在加载 OCR 引擎...");

      try {
        const text = await recognizeImage(dataUrl, (progress: OcrProgress) => {
          if (progress.status === "loading tesseract core") {
            setOcrStatus("正在加载 OCR 核心...");
          } else if (progress.status === "initializing tesseract") {
            setOcrStatus("正在初始化识别器...");
          } else if (progress.status === "loading language traineddata") {
            setOcrStatus("正在加载英文语言包...");
          } else if (progress.status === "recognizing text") {
            const pct = Math.round(progress.progress * 100);
            setOcrStatus(`正在识别文字... ${pct}%`);
          }
        });

        if (!text) {
          setOcrError("没有识别到可用英文文本，请确认图片内容清晰可读。");
          return;
        }

        const firstLine =
          text.split("\n").find((line) => line.trim().length > 0) || "";
        const title =
          firstLine.length > 60
            ? `${firstLine.slice(0, 60)}...`
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
        const message = err instanceof Error ? err.message : "OCR 识别失败";
        console.error("OCR error:", err);
        setOcrError(`文字识别失败：${message}`);
      }
    },
    [markVisited, setOcrError, setOcrLoading, setReader]
  );

  const handleRetry = useCallback(() => {
    if (currentReader) {
      removeReaderById(currentReader.id);
    }

    clearReader();
    setOcrStatus("");
  }, [clearReader, currentReader, removeReaderById]);

  const handlePasteText = useCallback(
    (text: string) => {
      const firstLine =
        text.split("\n").find((line) => line.trim().length > 0) || "";
      const title =
        firstLine.length > 60
          ? `${firstLine.slice(0, 60)}...`
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
    [markVisited, setReader]
  );

  if (!hydrated) {
    return (
      <div className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="terminal-card flex items-center justify-center gap-3 p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-text-muted">正在恢复上次阅读内容...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isFirstVisit && !currentReader) {
    return (
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className="terminal-card scanline overflow-hidden p-6 md:p-8">
            <div className="relative z-10 grid gap-6 md:grid-cols-[1.3fr_0.9fr] md:items-start">
              <div>
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-terminal">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
                  Welcome
                </p>
                <h1
                  className="mt-2 text-2xl font-bold text-text md:text-3xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  English Reading Assistant
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-text-muted md:text-base">
                  从单词、截图或拍照开始，快速生成一份可阅读、可跟读、可回看的英文练习材料。
                </p>
              </div>

              <div className="grid gap-3 text-sm text-text-muted">
                <div className="rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-text">
                    <BookOpen className="h-4 w-4 text-primary" />
                    先选难度
                  </div>
                  文章长度、词汇密度和解释方式会跟随你的等级调整。
                </div>
                <div className="rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-text">
                    <Sparkles className="h-4 w-4 text-primary" />
                    再选入口
                  </div>
                  可以输入单词，或者继续上传图片、粘贴整段英文材料。
                </div>
              </div>
            </div>
          </section>

          <LevelSelector />

          <div className="terminal-inset rounded-2xl p-4">
            <WordInput />
          </div>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(0,255,65,0.10)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg px-3 text-xs text-text-light">
                或者先导入一段英文材料
              </span>
            </div>
          </div>

          <button
            onClick={markVisited}
            className="terminal-btn flex min-h-12 w-full items-center justify-center gap-2 bg-primary/15 px-6 py-3 text-primary"
          >
            <span className="font-medium">继续，上传图片或拍照</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="terminal-card scanline overflow-hidden p-6 md:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
                Dashboard
              </p>
              <h1
                className="mt-2 text-2xl font-bold text-text md:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                准备今天的英文练习
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-text-muted md:text-base">
                输入单词、粘贴材料或上传图片后，就能直接进入阅读器继续训练。
              </p>
            </div>
            <button
              onClick={() => router.push("/history")}
              className="terminal-btn flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-primary md:self-start"
            >
              查看历史记录
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-xs text-text-light">
            <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
              当前等级：{LEVEL_LABELS[profile.level]}
            </span>
            <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
              当前昵称：{profile.nickname || "Learner"}
            </span>
            <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
              支持单词、粘贴文本、图片 OCR
            </span>
          </div>
        </section>

        <WordInput />

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(0,255,65,0.10)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg px-3 text-xs text-text-light">
              或导入现成英文材料
            </span>
          </div>
        </div>

        {!currentReader && (
          <div className="grid gap-4 md:grid-cols-2">
            <InfoTile
              icon={FileText}
              title="整段文本"
              description="适合已经复制好的文章、段落或课堂讲义。"
            />
            <InfoTile
              icon={ImageIcon}
              title="图片 OCR"
              description="适合教材页、截图、拍照文本，识别后可继续阅读。"
            />
          </div>
        )}

        {!currentReader && <PasteTextSection onText={handlePasteText} />}
        {!currentReader && (
          <ImageUploader onImage={handleImage} loading={ocrLoading} />
        )}

        {ocrLoading && (
          <div className="terminal-card flex flex-col items-center justify-center gap-3 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-text-muted">{ocrStatus}</p>
            <p className="text-xs text-text-light">
              首次加载会下载英文语言包，通常只需要几十秒，请稍等。
            </p>
          </div>
        )}

        {ocrError && !ocrLoading && (
          <div className="terminal-inset flex items-start gap-3 rounded-2xl border border-error/20 bg-error/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-error">识别失败</p>
              <p className="text-xs text-text-muted">{ocrError}</p>
            </div>
          </div>
        )}

        {currentReader && (
          <OCRResultPreview reader={currentReader} onRetry={handleRetry} />
        )}
      </div>
    </div>
  );
}

function PasteTextSection({ onText }: { onText: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="terminal-card w-full cursor-pointer p-5 text-left transition-colors hover:border-primary/20"
      >
        <div className="flex items-start gap-3 text-text-muted">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text">直接粘贴英文文本</p>
            <p className="mt-1 text-sm text-text-muted">
              适合已有文章、段落或课堂内容，提交后会立刻进入阅读流程。
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="terminal-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          粘贴英文文本
        </h2>
      </div>
      <p className="mb-3 text-sm text-text-muted">
        支持整段文章、课堂讲义或网页摘录。内容越完整，后续阅读体验越连贯。
      </p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="把英文内容粘贴到这里，然后点击下方按钮进入阅读器。"
        rows={6}
        className="terminal-inset w-full resize-y rounded-xl p-4 text-sm text-text outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-text-light">
          已输入 {text.trim() ? text.trim().length : 0} 个字符
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (text.trim()) onText(text.trim());
            }}
            disabled={!text.trim()}
            className="terminal-btn flex min-h-11 items-center gap-2 bg-primary/15 px-5 py-2.5 text-primary disabled:opacity-40"
          >
            <span className="text-sm font-medium">进入阅读器</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShow(false)}
            className="flex min-h-11 items-center text-sm text-text-muted transition-colors hover:text-text"
          >
            收起
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/70 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
    </div>
  );
}
