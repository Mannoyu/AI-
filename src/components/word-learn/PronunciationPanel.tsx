"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Mic } from "lucide-react";
import { createAudioRecorder, type AudioRecorder } from "@/lib/audio-record";
import { alignWords, calculateScore, extractWords } from "@/lib/pronunciation";
import { useWordLearnStore } from "@/stores/useWordLearnStore";
import type { FeedbackToken, RecordingState } from "@/types";
import { RecordButton } from "./RecordButton";
import { WaveformDisplay } from "./WaveformDisplay";
import { WordFeedback } from "./WordFeedback";

interface PronunciationPanelProps {
  targetWord: string;
  onPracticeComplete?: (
    tokens: FeedbackToken[],
    score: number
  ) => void | Promise<void>;
}

type ErrorKind = "mic-denied" | "mic-not-found" | "asr-failed" | "no-speech";

function errorMessage(kind: ErrorKind): { title: string; detail: string } {
  switch (kind) {
    case "mic-denied":
      return {
        title: "麦克风权限被拒绝",
        detail:
          "请在浏览器地址栏左侧打开站点权限，允许访问麦克风后刷新页面再试。",
      };
    case "mic-not-found":
      return {
        title: "未检测到麦克风",
        detail: "请确认麦克风已连接，并且系统中可以正常使用。",
      };
    case "asr-failed":
      return {
        title: "语音识别失败",
        detail: "识别服务暂时不可用，请稍后重试。",
      };
    case "no-speech":
      return {
        title: "没有检测到清晰语音",
        detail: "请靠近麦克风并清晰朗读，再录一次试试。",
      };
  }
}

export function PronunciationPanel({
  targetWord,
  onPracticeComplete,
}: PronunciationPanelProps) {
  const {
    selectedSentence,
    recordingState,
    feedbackTokens,
    score,
    setRecordingState,
    setFeedbackTokens,
    setScore,
    setPracticeResult,
  } = useWordLearnStore();

  return (
    <div className="terminal-card p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta/10">
          <Mic className="h-4 w-4 text-cta" />
        </div>
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            跟读练习
          </h2>
          <p className="text-xs text-text-light">语音识别评估</p>
        </div>
      </div>

      {!selectedSentence ? (
        <div className="terminal-inset rounded-2xl p-8 text-center">
          <Mic className="mx-auto mb-3 h-10 w-10 text-text-light" />
          <p className="text-sm text-text-muted">
            请先在上方文章中选择一句你想练习朗读的句子。
          </p>
        </div>
      ) : (
        <PronunciationSession
          key={selectedSentence}
          selectedSentence={selectedSentence}
          targetWord={targetWord}
          recordingState={recordingState}
          feedbackTokens={feedbackTokens}
          score={score}
          setRecordingState={setRecordingState}
          setFeedbackTokens={setFeedbackTokens}
          setScore={setScore}
          setPracticeResult={setPracticeResult}
          onPracticeComplete={onPracticeComplete}
        />
      )}
    </div>
  );
}

interface PronunciationSessionProps {
  selectedSentence: string;
  targetWord: string;
  recordingState: RecordingState;
  feedbackTokens: FeedbackToken[];
  score: number | null;
  setRecordingState: (state: RecordingState) => void;
  setFeedbackTokens: (tokens: FeedbackToken[]) => void;
  setScore: (score: number | null) => void;
  setPracticeResult: (tokens: FeedbackToken[], score: number) => void;
  onPracticeComplete?: (
    tokens: FeedbackToken[],
    score: number
  ) => void | Promise<void>;
}

function PronunciationSession({
  selectedSentence,
  targetWord,
  recordingState,
  feedbackTokens,
  score,
  setRecordingState,
  setFeedbackTokens,
  setScore,
  setPracticeResult,
  onPracticeComplete,
}: PronunciationSessionProps) {
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [waveformSamples, setWaveformSamples] = useState<Float32Array | null>(null);
  const liveSamplesRef = useRef<Float32Array | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);

  const cleanupSession = useCallback(async () => {
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    liveSamplesRef.current = null;

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      await recorder.dispose().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      void cleanupSession();
    };
  }, [cleanupSession]);

  useEffect(() => {
    const handlePageHide = () => {
      disposedRef.current = true;
      void cleanupSession();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [cleanupSession]);

  const handleStartRecording = useCallback(async () => {
    if (
      isStarting ||
      recordingState === "recording" ||
      recordingState === "processing"
    ) {
      return;
    }

    setIsStarting(true);
    setErrorKind(null);
    setFeedbackTokens([]);
    setScore(null);
    setRecordingState("idle");
    setWaveformSamples(null);
    await cleanupSession();
    disposedRef.current = false;

    try {
      const recorder = await createAudioRecorder({
        targetSampleRate: 16000,
        onSamples: (samples) => {
          liveSamplesRef.current = new Float32Array(samples);
        },
      });

      if (disposedRef.current) {
        await recorder.dispose().catch(() => undefined);
        return;
      }

      recorderRef.current = recorder;
      await recorder.start();

      if (disposedRef.current) {
        await recorder.dispose().catch(() => undefined);
        return;
      }

      setRecordingState("recording");
    } catch (err) {
      const error = err as Error;

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setErrorKind("mic-denied");
      } else if (error.name === "NotFoundError") {
        setErrorKind("mic-not-found");
      } else {
        setErrorKind("mic-denied");
      }
    } finally {
      setIsStarting(false);
    }
  }, [
    cleanupSession,
    isStarting,
    recordingState,
    setFeedbackTokens,
    setRecordingState,
    setScore,
  ]);

  const handleStopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;

    if (!recorder) {
      setRecordingState("idle");
      return;
    }

    setRecordingState("processing");
    liveSamplesRef.current = null;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;

    let audioBlob: Blob;
    try {
      const result = await recorder.stop();
      if (disposedRef.current) {
        return;
      }

      audioBlob = result.blob;
      setWaveformSamples(result.samples);
    } catch {
      if (disposedRef.current) {
        return;
      }

      setRecordingState("idle");
      setErrorKind("no-speech");
      return;
    }

    if (audioBlob.size <= 44) {
      setRecordingState("idle");
      setErrorKind("no-speech");
      return;
    }

    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const response = await fetch("/api/speech/recognize", {
        method: "POST",
        body: audioBlob,
        signal: controller.signal,
      });
      const data = await response.json();

      if (controller.signal.aborted || disposedRef.current) {
        return;
      }

      if (!response.ok || data.error) {
        setRecordingState("idle");
        setErrorKind("asr-failed");
        return;
      }

      const transcript = String(data.text || "").trim();
      if (!transcript) {
        setRecordingState("idle");
        setErrorKind("no-speech");
        return;
      }

      const originalWords = extractWords(selectedSentence);
      const spokenWords = extractWords(transcript);
      const tokens = alignWords(originalWords, spokenWords, targetWord);
      const calculatedScore = calculateScore(tokens);

      setPracticeResult(tokens, calculatedScore);
      Promise.resolve(onPracticeComplete?.(tokens, calculatedScore)).catch(
        () => undefined
      );
    } catch (err) {
      if (controller.signal.aborted || disposedRef.current) {
        return;
      }

      console.error("Speech recognition failed:", err);
      setRecordingState("idle");
      setErrorKind("asr-failed");
    } finally {
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
    }
  }, [
    onPracticeComplete,
    selectedSentence,
    setPracticeResult,
    setRecordingState,
    targetWord,
  ]);

  const err = errorKind ? errorMessage(errorKind) : null;
  const showFeedback = recordingState === "done" && feedbackTokens.length > 0;
  const sentenceWordCount = extractWords(selectedSentence).length;
  const statusText = isStarting
    ? "正在准备麦克风..."
    : recordingState === "idle"
      ? "点击录音，开始朗读上方句子。"
      : recordingState === "recording"
        ? "正在录音..."
        : recordingState === "processing"
          ? "正在识别语音..."
          : "识别完成，可以继续重复练习。";

  return (
    <div className="space-y-4">
      {err && (
        <div className="terminal-inset flex items-start gap-3 rounded-2xl border border-error/20 bg-error/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium text-error">{err.title}</p>
            <p className="text-xs leading-relaxed text-text-muted">{err.detail}</p>
          </div>
        </div>
      )}

      <div className="terminal-inset rounded-xl p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-light">
          <span>当前练习句子</span>
          <span>{sentenceWordCount} 词</span>
        </div>
        <p className="text-[15px] leading-relaxed text-text">{selectedSentence}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <RecordButton
          state={recordingState}
          preparing={isStarting}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
        />
        <span className="text-xs text-text-muted" aria-live="polite">
          {statusText}
        </span>
      </div>

      <WaveformDisplay
        isRecording={recordingState === "recording"}
        isProcessing={recordingState === "processing" || isStarting}
        hasResult={recordingState === "done"}
        liveSamplesRef={liveSamplesRef}
        recordedSamples={waveformSamples}
        score={score}
      />

      {showFeedback && (
        <WordFeedback tokens={feedbackTokens} targetWord={targetWord} />
      )}
    </div>
  );
}
