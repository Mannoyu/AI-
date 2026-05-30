"use client";

import { useRef, useEffect } from "react";
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
const R = 0, G = 255, B = 65;

/** Build rgba on the fly — inline to avoid string concat overhead in hot loop. */
const barColorCache = new Array<string>(256);
function barColor(alpha255: number): string {
  let c = barColorCache[alpha255];
  if (!c) {
    c = `rgba(${R},${G},${B},${(alpha255 / 255).toFixed(2)})`;
    barColorCache[alpha255] = c;
  }
  return c;
}

/**
 * Downsample audio samples into peak amplitudes.
 * Fast path: stride through buckets.
 */
function downsamplePeaks(samples: Float32Array, count: number, out: number[]): void {
  const len = samples.length;
  if (len === 0) {
    for (let i = 0; i < count; i++) out[i] = 0.04;
    return;
  }

  const step = len / count;
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const stride = Math.max(1, Math.floor((end - start) / 6));
    let peak = 0;
    for (let j = start; j < end; j += stride) {
      const v = samples[j];
      if (v > peak) peak = v;
      else if (-v > peak) peak = -v;
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
  const animFrameRef = useRef(0);
  const wRef = useRef(0);
  const hRef = useRef(0);

  const modeRef = useRef({ isRecording, isProcessing, hasResult });
  modeRef.current = { isRecording, isProcessing, hasResult };

  // Cache recorded peaks so we don't recompute every frame
  const recordedPeaksRef = useRef<number[] | null>(null);
  const prevRecordedRef = useRef<Float32Array | null>(null);

  // Compute recorded peaks only when recordedSamples changes
  if (recordedSamples !== prevRecordedRef.current) {
    prevRecordedRef.current = recordedSamples;
    if (recordedSamples) {
      const peaks = new Array<number>(BAR_COUNT);
      downsamplePeaks(recordedSamples, BAR_COUNT, peaks);
      recordedPeaksRef.current = peaks;
    } else {
      recordedPeaksRef.current = null;
    }
  }

  // ResizeObserver to cache dimensions (avoids getBoundingClientRect per frame)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      wRef.current = rect.width;
      hRef.current = rect.height;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const bw = Math.floor(rect.width * dpr);
      const bh = Math.floor(rect.height * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Animation loop — runs once for the lifetime of the component
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const peaksBuf = new Array<number>(BAR_COUNT);

    function frame() {
      if (!running || !ctx || !canvas) return;

      const w = wRef.current;
      const h = hRef.current;
      if (w <= 0 || h <= 0) {
        animFrameRef.current = requestAnimationFrame(frame);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { isRecording: rec, isProcessing: proc, hasResult: done } = modeRef.current;

      // Get peaks from the right source
      let peaks: number[];
      if (rec) {
        const live = liveSamplesRef.current;
        if (live) {
          downsamplePeaks(live, BAR_COUNT, peaksBuf);
          peaks = peaksBuf;
        } else {
          peaks = new Array(BAR_COUNT).fill(0.04);
        }
      } else if (done && recordedPeaksRef.current) {
        peaks = recordedPeaksRef.current;
      } else if (proc && recordedPeaksRef.current) {
        peaks = recordedPeaksRef.current;
      } else {
        peaks = new Array(BAR_COUNT).fill(0.04);
      }

      const barW = (w / BAR_COUNT) * 0.72;
      const maxHalf = h * 0.44;
      const cy = h / 2;

      animFrameRef.current++;

      for (let i = 0; i < BAR_COUNT; i++) {
        const amp = peaks[i];
        if (amp < 0.001) continue; // skip invisible bars

        // Opacity
        let alpha: number;
        if (rec) {
          alpha = 115 + Math.round(amp * 140); // 0.45–1.0
        } else if (proc) {
          const scan = ((animFrameRef.current * 2.5 + i) % BAR_COUNT) / BAR_COUNT;
          alpha = 51 + Math.round(204 * (1 - Math.abs(scan - 0.5) * 2)); // 0.2–1.0
        } else {
          alpha = 153; // 0.6
        }

        const half = amp * maxHalf < 1.5 ? 1.5 : amp * maxHalf;
        const x = i * (w / BAR_COUNT);
        const y = cy - half;

        // Use fillRect for speed (no path operations)
        // Top half — dimmer
        ctx.fillStyle = barColor(Math.round(alpha * 0.55));
        ctx.fillRect(x, y, barW, half);

        // Center stripe — brightest
        const stripeH = Math.min(half * 0.3, 4);
        ctx.fillStyle = barColor(Math.min(alpha + 51, 255));
        ctx.fillRect(x, cy - stripeH / 2, barW, stripeH);

        // Bottom half — dimmer
        ctx.fillStyle = barColor(Math.round(alpha * 0.55));
        ctx.fillRect(x, cy, barW, half);
      }

      animFrameRef.current = requestAnimationFrame(frame);
    }

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusLabel = isRecording
    ? "录音中 — 实时波形"
    : isProcessing
      ? "分析中..."
      : hasResult
        ? "录音波形"
        : "等待录音";

  return (
    <div className="terminal-inset rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity
          className={`w-4 h-4 ${
            isRecording ? "text-primary animate-pulse" : "text-text-muted"
          }`}
        />
        <span className="text-sm font-medium text-text-muted">
          {statusLabel}
        </span>
        {isRecording && (
          <span className="ml-auto w-2 h-2 rounded-full bg-error animate-pulse" />
        )}
      </div>

      <div
        ref={containerRef}
        className="relative h-24 rounded-xl overflow-hidden bg-surface-alt/50"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {hasResult && score !== null && (
          <div className="absolute inset-0 bg-surface/50 flex items-center justify-center">
            <div className="text-center">
              <p
                className="text-3xl font-bold"
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
              <p className="text-xs text-text-muted mt-0.5">发音得分</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
