"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  Languages,
  ScanText,
  X,
} from "lucide-react";
import { ReadingBar } from "@/components/reader/ReadingBar";
import { TextDisplay } from "@/components/reader/TextDisplay";
import { WordPanel } from "@/components/reader/WordPanel";
import { useReaderStore } from "@/stores/useReaderStore";

function splitToSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?]+[\s]*|[^.!?\n]+$/g);
  if (!matches || matches.length === 0) return [text];
  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

export default function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [highlightSentenceIndex, setHighlightSentenceIndex] = useState<
    number | null
  >(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const { hydrated, getReaderById } = useReaderStore();
  const reader = hydrated ? getReaderById(id) : null;

  useEffect(() => {
    if (!showMobilePanel) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobilePanel]);

  const handleWordClick = useCallback((word: string) => {
    setSelectedWord((prev) => {
      const nextWord = prev === word ? null : word;
      setShowMobilePanel(Boolean(nextWord));
      return nextWord;
    });
  }, []);

  const sentences = useMemo(
    () => (reader ? splitToSentences(reader.ocrText) : []),
    [reader]
  );

  const wordCount = reader?.ocrText.split(/\s+/).filter(Boolean).length ?? 0;
  const sentenceCount = sentences.length;

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="terminal-card flex w-full max-w-md items-center justify-center gap-3 p-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-muted">正在恢复阅读内容...</p>
        </div>
      </div>
    );
  }

  if (!reader) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="terminal-card w-full max-w-md p-8 text-center">
          <FileQuestion className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <h2
            className="mb-2 text-lg font-semibold text-text"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            未找到阅读内容
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-text-muted">
            当前链接对应的阅读材料不在本地缓存里。请从首页重新上传图片，或重新粘贴文本进入阅读器。
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="terminal-btn inline-flex items-center gap-2 bg-primary/15 px-6 py-2.5 text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">返回首页</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>

        <section className="terminal-card scanline overflow-hidden p-5 md:p-6">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
                Reader
              </p>
              <h1
                className="mt-2 break-words text-xl font-semibold text-text md:text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {reader.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-text-muted">
                点击正文中的单词，右侧会生成对应的多语义练习入口；使用朗读控制可以逐句收听并同步高亮。
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-text-light md:max-w-sm md:justify-end">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                <ScanText className="h-3.5 w-3.5 text-primary" />
                {wordCount} 词
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                <Languages className="h-3.5 w-3.5 text-primary" />
                {sentenceCount} 句
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                当前选词：{selectedWord || "未选择"}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="terminal-card p-5 md:p-6">
              <div className="mb-4">
                <ReadingBar
                  sentences={sentences}
                  onSentenceChange={setHighlightSentenceIndex}
                />
              </div>

              <div className="terminal-inset rounded-2xl p-5 md:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-light">
                  <span>正文</span>
                  <span>
                    {highlightSentenceIndex != null
                      ? `正在朗读第 ${highlightSentenceIndex + 1} 句`
                      : "点击任意英文单词可打开学习面板"}
                  </span>
                </div>
                <TextDisplay
                  text={reader.ocrText}
                  selectedWord={selectedWord}
                  onWordClick={handleWordClick}
                  highlightSentenceIndex={highlightSentenceIndex}
                  className="text-[15px] leading-[1.95] text-text"
                />
              </div>
            </section>
          </div>

          <aside className="hidden space-y-4 xl:sticky xl:top-4 xl:block xl:self-start">
            {selectedWord ? (
              <WordPanel word={selectedWord} readerId={id} wordCount={wordCount} />
            ) : (
              <div className="terminal-card p-5">
                <p
                  className="mb-2 text-base font-semibold text-text"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  单词学习面板
                </p>
                <div className="terminal-inset rounded-xl p-4 text-sm leading-relaxed text-text-muted">
                  点击正文里的任意英文单词，这里会显示当前选词、文章难度和进入多语义练习的入口。
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {selectedWord && (
        <>
          <button
            type="button"
            onClick={() => setShowMobilePanel(true)}
            className="fixed bottom-4 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-bg shadow-terminal xl:hidden"
          >
            <BookOpen className="h-4 w-4" />
            学习 {selectedWord}
          </button>

          {showMobilePanel && (
            <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="关闭单词学习面板"
                className="absolute inset-0 bg-bg/70"
                onClick={() => setShowMobilePanel(false)}
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl border border-[rgba(0,255,65,0.08)] bg-bg p-4 shadow-terminal">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-base font-semibold text-text"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      单词学习面板
                    </p>
                    <p className="text-xs text-text-light">
                      当前选词：{selectedWord}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobilePanel(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-text-muted transition-colors hover:text-text"
                    aria-label="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-y-auto pb-2">
                  <WordPanel
                    word={selectedWord}
                    readerId={id}
                    wordCount={wordCount}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
