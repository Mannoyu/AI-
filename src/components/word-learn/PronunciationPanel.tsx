"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWordLearnStore } from "@/stores/useWordLearnStore";
import { RecordButton } from "./RecordButton";
import { WaveformDisplay } from "./WaveformDisplay";
import { WordFeedback } from "./WordFeedback";
import { Mic, AlertTriangle } from "lucide-react";
import { alignWords, calculateScore, extractWords } from "@/lib/pronunciation";
import { createAudioRecorder, type AudioRecorder } from "@/lib/audio-record";

interface PronunciationPanelProps {
  targetWord: string;
}

type ErrorKind = "mic-denied" | "mic-not-found" | "asr-failed" | "no-speech";

function errorMessage(kind: ErrorKind): { title: string; detail: string } {
  switch (kind) {
    case "mic-denied":
      return {
        title: "麦克风权限被拒绝",
        detail: "请在浏览器地址栏左侧点击锁图标 → 开启麦克风权限，然后刷新页面。",
      };
    case "mic-not-found":
      return {
        title: "未检测到麦克风",
        detail: "请确认麦克风已连接且正常工作。",
      };
    case "asr-failed":
      return {
        title: "语音识别失败",
        detail: "百度语音识别服务返回错误，请稍后重试。如果持续失败，可能是 API 配额不足。",
      };
    case "no-speech":
      return {
        title: "未检测到语音",
        detail: "请靠近麦克风清晰朗读，录音后重试。",
      };
  }
}

export function PronunciationPanel({ targetWord }: PronunciationPanelProps) {
  const {
    selectedSentence,
    recordingState,
    feedbackTokens,
    score,
    setRecordingState,
    setFeedbackTokens,
    setScore,
  } = useWordLearnStore();

  const [showFeedback, setShowFeedback] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [waveformSamples, setWaveformSamples] = useState<Float32Array | null>(null);
  // Ref for live samples — mutated directly by onSamples without triggering re-renders
  const liveSamplesRef = useRef<Float32Array | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Reset when sentence changes
  useEffect(() => {
    setShowFeedback(false);
    setErrorKind(null);
    setFeedbackTokens([]);
    setScore(null);
    setRecordingState("idle");
    setWaveformSamples(null);
    liveSamplesRef.current = null;
  }, [selectedSentence, setFeedbackTokens, setScore, setRecordingState]);

  const handleStartRecording = useCallback(async () => {
    setErrorKind(null);
    setShowFeedback(false);
    setFeedbackTokens([]);
    setScore(null);
    setWaveformSamples(null);
    liveSamplesRef.current = null;

    // Create recorder with live sample feed for waveform
    try {
      const recorder = await createAudioRecorder({
        targetSampleRate: 16000,
        onSamples: (samples) => {
          // Write directly to ref — no React re-render, 60fps smooth
          liveSamplesRef.current = new Float32Array(samples);
        },
      });
      recorderRef.current = recorder;
    } catch (err: unknown) {
      const e = err as Error;
      console.error("createAudioRecorder error:", e.name, e.message);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setErrorKind("mic-denied");
      } else if (e.name === "NotFoundError") {
        setErrorKind("mic-not-found");
      } else {
        setErrorKind("mic-denied");
      }
      return;
    }

    await recorderRef.current.start();
    setRecordingState("recording");
  }, [setRecordingState, setFeedbackTokens, setScore]);

  const handleStopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;

    if (!recorder) {
      setRecordingState("idle");
      return;
    }

    setRecordingState("processing");
    liveSamplesRef.current = null; // stop live feed

    let audioBlob: Blob;
    try {
      const result = await recorder.stop();
      audioBlob = result.blob;
      setWaveformSamples(result.samples);
    } catch {
      setRecordingState("idle");
      setErrorKind("no-speech");
      return;
    }

    console.log(`[PronunciationPanel] Audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    if (audioBlob.size < 44) {
      // Smaller than WAV header — effectively empty
      setRecordingState("idle");
      setErrorKind("no-speech");
      return;
    }

    // Send to Baidu ASR
    try {
      const response = await fetch("/api/speech/recognize", {
        method: "POST",
        body: audioBlob,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("ASR API error:", data.error);
        setRecordingState("idle");
        setErrorKind("asr-failed");
        return;
      }

      const transcript: string = (data.text || "").trim();

      if (!transcript) {
        setRecordingState("idle");
        setErrorKind("no-speech");
        return;
      }

      if (!selectedSentence) {
        setRecordingState("idle");
        return;
      }

      const originalWords = extractWords(selectedSentence);
      const spokenWords = extractWords(transcript);
      const tokens = alignWords(originalWords, spokenWords, targetWord);
      const calculatedScore = calculateScore(tokens);

      setFeedbackTokens(tokens);
      setScore(calculatedScore);
      setRecordingState("done");
      setShowFeedback(true);
    } catch (err) {
      console.error("ASR fetch error:", err);
      setRecordingState("idle");
      setErrorKind("asr-failed");
    }
  }, [selectedSentence, targetWord, setRecordingState, setFeedbackTokens, setScore]);

  const err = errorKind ? errorMessage(errorKind) : null;

  return (
    <div className="terminal-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center">
          <Mic className="w-4 h-4 text-cta" />
        </div>
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          跟读练习
        </h2>
        <span className="text-xs text-text-light ml-auto">百度语音识别</span>
      </div>

      {/* Error */}
      {err && (
        <div className="terminal-inset rounded-2xl p-4 mb-4 flex items-start gap-3 border border-error/20 bg-error/5">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-error mb-1">{err.title}</p>
            <p className="text-xs text-text-muted leading-relaxed">{err.detail}</p>
          </div>
        </div>
      )}

      {!selectedSentence ? (
        <div className="terminal-inset rounded-2xl p-8 text-center">
          <Mic className="w-10 h-10 text-text-light mx-auto mb-3" />
          <p className="text-text-muted text-sm">
            请在上方文章中点击一句你想练习朗读的句子
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Sentence */}
          <div className="terminal-inset rounded-xl p-4">
            <p className="text-xs text-text-muted mb-1 font-medium">
              当前练习句子：
            </p>
            <p className="text-text leading-relaxed text-[15px]">
              {selectedSentence}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <RecordButton
              state={recordingState}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
            />
            <span className="text-xs text-text-muted">
              {recordingState === "idle" && "点击录音开始朗读上方句子"}
              {recordingState === "recording" && "正在录音中..."}
              {recordingState === "processing" && "正在识别语音..."}
              {recordingState === "done" && "识别完成！可再次练习"}
            </span>
          </div>

          {/* Waveform */}
          <WaveformDisplay
            isRecording={recordingState === "recording"}
            isProcessing={recordingState === "processing"}
            hasResult={recordingState === "done"}
            liveSamplesRef={liveSamplesRef}
            recordedSamples={waveformSamples}
            score={score}
          />

          {/* Word Feedback */}
          {showFeedback && (
            <WordFeedback tokens={feedbackTokens} targetWord={targetWord} />
          )}
        </div>
      )}
    </div>
  );
}
