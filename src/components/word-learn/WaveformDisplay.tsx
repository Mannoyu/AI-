"use client";

import { useEffect, useMemo, useRef } from "react";
import { Activity } from "lucide-react";

interface WaveformDisplayProps {
  isRecording: boolean;
  isProcessing: boolean;
  hasResult: boolean;
  liveSamplesRef: React.MutableRefObject<Float32Array | null>;
  recordedSamples: Float32Array | null;
  score: number | null;
}

const BAR_COUNT = 80;
const R = 0;
const G = 255;
const B = 65;
const IDLE_PEAKS = Array.from({ length: BAR_COUNT }, () => 0.04);

const barColorCache = new Array<string>(256);

function barColor(alpha255: number): string {
  let color = barColorCache[alpha255];
  if (!color) {
    color = `rgba(${R},${G},${B},${(alpha255 / 255).toFixed(2)})`;
    barColorCache[alpha255] = color;
  }

  return color;
}

function downsamplePeaks(samples: Float32Array, count: number, out: number[]) {
  const len = samples.length;
  if (len === 0) {
    for (let i = 0; i < count; i += 1) out[i] = 0.04;
    return;
  }

  const step = len / count;
  for (let i = 0; i < count; i += 1) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const stride = Math.max(1, Math.floor((end - start) / 6));
    let peak = 0;

    for (let j = start; j < end; j += stride) {
      const value = samples[j];
      if (value > peak) peak = value;
      else if (-value > peak) peak = -value;
    }

    out[i] = peak > 1 ? 1 : peak;
  }
}

export function WaveformDisplay({
  isRecording,
  isProcessing,
  hasResult,
  liveSamplesRef,
  recordedSamples,
  score,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameCounterRef = useRef(0);
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const rafIdRef = useRef(0);
  const modeRef = useRef({ isRecording, isProcessing, hasResult });

  const recordedPeaks = useMemo(() => {
    if (!recordedSamples) return null;

    const peaks = new Array<number>(BAR_COUNT);
    downsamplePeaks(recordedSamples, BAR_COUNT, peaks);
    return peaks;
  }, [recordedSamples]);

  useEffect(() => {
    modeRef.current = { isRecording, isProcessing, hasResult };
  }, [hasResult, isProcessing, isRecording]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      widthRef.current = rect.width;
      heightRef.current = rect.height;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(rect.width * dpr);
      const height = Math.floor(rect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const peaksBuffer = new Array<number>(BAR_COUNT);

    const draw = () => {
      if (!running) return;

      const width = widthRef.current;
      const height = heightRef.current;
      if (width <= 0 || height <= 0) {
        rafIdRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const mode = modeRef.current;
      let peaks: number[];

      if (mode.isRecording) {
        const live = liveSamplesRef.current;
        if (live) {
          downsamplePeaks(live, BAR_COUNT, peaksBuffer);
          peaks = peaksBuffer;
        } else {
          peaks = IDLE_PEAKS;
        }
      } else if ((mode.isProcessing || mode.hasResult) && recordedPeaks) {
        peaks = recordedPeaks;
      } else {
        peaks = IDLE_PEAKS;
      }

      const barWidth = (width / BAR_COUNT) * 0.72;
      const maxHalf = height * 0.44;
      const centerY = height / 2;

      frameCounterRef.current += 1;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const amp = peaks[i];
        if (amp < 0.001) continue;

        let alpha: number;
        if (mode.isRecording) {
          alpha = 115 + Math.round(amp * 140);
        } else if (mode.isProcessing) {
          const scan =
            ((frameCounterRef.current * 2.5 + i) % BAR_COUNT) / BAR_COUNT;
          alpha = 51 + Math.round(204 * (1 - Math.abs(scan - 0.5) * 2));
        } else {
          alpha = 153;
        }

        const half = amp * maxHalf < 1.5 ? 1.5 : amp * maxHalf;
        const x = i * (width / BAR_COUNT);
        const y = centerY - half;
        const stripeHeight = Math.min(half * 0.3, 4);

        ctx.fillStyle = barColor(Math.round(alpha * 0.55));
        ctx.fillRect(x, y, barWidth, half);

        ctx.fillStyle = barColor(Math.min(alpha + 51, 255));
        ctx.fillRect(x, centerY - stripeHeight / 2, barWidth, stripeHeight);

        ctx.fillStyle = barColor(Math.round(alpha * 0.55));
        ctx.fillRect(x, centerY, barWidth, half);
      }

      rafIdRef.current = requestAnimationFrame(draw);
    };

    rafIdRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [liveSamplesRef, recordedPeaks]);

  const statusLabel = isRecording
    ? "录音中 · 实时波形"
    : isProcessing
      ? "处理中..."
      : hasResult
        ? "录音波形"
        : "等待录音";

  return (
    <div className="terminal-inset rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Activity
          className={`h-4 w-4 ${
            isRecording ? "animate-pulse text-primary" : "text-text-muted"
          }`}
        />
        <span className="text-sm font-medium text-text-muted">{statusLabel}</span>
        {isRecording && (
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-error" />
        )}
      </div>

      <div
        ref={containerRef}
        className="relative h-24 overflow-hidden rounded-xl bg-surface-alt/50"
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {hasResult && score !== null && (
          <div className="absolute right-3 top-3">
            <div className="rounded-xl border border-primary/10 bg-surface/85 px-3 py-2 text-center shadow-terminal">
              <p
                className="text-xl font-bold leading-none"
                style={{
                  color:
                    score >= 80
                      ? "var(--color-success)"
                      : score >= 60
                        ? "var(--color-warning)"
                        : "var(--color-error)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {score}
              </p>
              <p className="mt-1 text-[10px] text-text-muted">发音得分</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
