"use client";

import { useState, useCallback, use, useMemo } from "react";
import { TextDisplay } from "@/components/reader/TextDisplay";
import { WordPanel } from "@/components/reader/WordPanel";
import { ReadingBar } from "@/components/reader/ReadingBar";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReaderStore } from "@/stores/useReaderStore";

/**
 * Split text into sentences for TTS reading.
 * Returns an array of sentence strings, trimming whitespace.
 */
function splitToSentences(text: string): string[] {
  // Match sentence content followed by terminator + optional whitespace
  const matches = text.match(/[^.!?\n]+[.!?]+[\s]*|[^.!?\n]+$/g);
  if (!matches || matches.length === 0) return [text];
  return matches.map((s) => s.trim()).filter(Boolean);
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
  const { currentReader } = useReaderStore();

  // Guard: only render if the store has matching OCR data for this URL
  const readerMatches = currentReader && currentReader.id === id;

  if (!readerMatches) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="terminal-card p-8 text-center max-w-md w-full">
          <FileQuestion className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2
            className="text-lg font-semibold text-text mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            未找到阅读内容
          </h2>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            请从首页上传包含英文文本的图片，OCR 识别后将自动跳转到此页面
          </p>
          <button
            onClick={() => router.push("/")}
            className="terminal-btn inline-flex items-center gap-2 px-6 py-2.5 bg-primary/15 text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">返回首页</span>
          </button>
        </div>
      </div>
    );
  }

  const reader = currentReader;

  const handleWordClick = useCallback((word: string) => {
    setSelectedWord((prev) => (prev === word ? null : word));
  }, []);

  const sentences = useMemo(
    () => splitToSentences(reader.ocrText),
    [reader.ocrText]
  );

  const wordCount = reader.ocrText.split(/\s+/).length;

  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="terminal-card p-6">
              <h1
                className="text-xl font-semibold mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {reader.title}
              </h1>

              {/* TTS Reading Bar */}
              <div className="mb-4">
                <ReadingBar
                  sentences={sentences}
                  onSentenceChange={setHighlightSentenceIndex}
                />
              </div>

              <TextDisplay
                text={reader.ocrText}
                selectedWord={selectedWord}
                onWordClick={handleWordClick}
                highlightSentenceIndex={highlightSentenceIndex}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            {selectedWord ? (
              <WordPanel
                word={selectedWord}
                readerId={id}
                wordCount={wordCount}
              />
            ) : (
              <div className="terminal-card p-6 text-center">
                <p className="text-sm text-text-muted">
                  点击文中任意单词
                  <br />
                  生成 AI 多语义学习文章
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile word panel */}
        {selectedWord && (
          <div className="mt-4 lg:hidden">
            <WordPanel
              word={selectedWord}
              readerId={id}
              wordCount={wordCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
