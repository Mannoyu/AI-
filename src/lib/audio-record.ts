/**
 * Browser-side audio recording utility.
 *
 * Captures raw PCM from the microphone using Web Audio API,
 * encodes to WAV format for sending to the STT server.
 *
 * Also exposes live audio samples for waveform visualization.
 */

export interface AudioRecorder {
  start(): Promise<void>;
  stop(): Promise<{ blob: Blob; samples: Float32Array }>;
  dispose(): Promise<void>;
  isRecording(): boolean;
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const byteCount = samples.length * 2;
  const buffer = new ArrayBuffer(44 + byteCount);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + byteCount, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, byteCount, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(
      offset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true
    );
    offset += 2;
  }

  return buffer;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

export interface AudioRecorderOptions {
  targetSampleRate?: number;
  onSamples?: (samples: Float32Array) => void;
}

export async function createAudioRecorder(
  options: AudioRecorderOptions = {}
): Promise<AudioRecorder> {
  const { targetSampleRate = 16000, onSamples } = options;

  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    throw new Error("Audio recording is not supported in this browser");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext({ sampleRate: targetSampleRate });
  const source = audioCtx.createMediaStreamSource(stream);
  const sink = audioCtx.createGain();
  sink.gain.value = 0;
  sink.connect(audioCtx.destination);

  const actualRate = audioCtx.sampleRate;
  const allSamples: number[] = [];
  let scriptNode: ScriptProcessorNode | null = null;
  let started = false;
  let stopped = false;
  let released = false;

  function createSilentResult() {
    const silent = new Float32Array(1600);
    const wavBuffer = encodeWAV(silent, targetSampleRate);

    return {
      blob: new Blob([wavBuffer], { type: "audio/wav" }),
      samples: silent,
    };
  }

  function cleanupGraph() {
    if (scriptNode) {
      scriptNode.onaudioprocess = null;
      try {
        scriptNode.disconnect();
      } catch {
        // Already disconnected.
      }
      scriptNode = null;
    }

    try {
      source.disconnect();
    } catch {
      // Source may not have been connected yet.
    }

    try {
      sink.disconnect();
    } catch {
      // Sink may already be disconnected.
    }
  }

  async function releaseResources() {
    if (released) {
      return;
    }

    released = true;
    stream.getTracks().forEach((track) => track.stop());
    if (audioCtx.state !== "closed") {
      await audioCtx.close();
    }
  }

  return {
    async start() {
      if (started || stopped) {
        return;
      }

      started = true;
      allSamples.length = 0;
      await audioCtx.resume();

      scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
        const input = event.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i += 1) {
          allSamples.push(input[i]);
        }

        onSamples?.(input);
      };

      source.connect(scriptNode);
      scriptNode.connect(sink);
    },

    async stop() {
      if (stopped) {
        return createSilentResult();
      }

      stopped = true;

      if (started) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }

      cleanupGraph();
      await releaseResources();

      if (allSamples.length === 0) {
        return createSilentResult();
      }

      const combined = new Float32Array(allSamples);
      const samples =
        actualRate === targetSampleRate
          ? combined
          : resample(combined, actualRate, targetSampleRate);

      const wavBuffer = encodeWAV(samples, targetSampleRate);

      return {
        blob: new Blob([wavBuffer], { type: "audio/wav" }),
        samples,
      };
    },

    async dispose() {
      if (stopped) {
        await releaseResources();
        return;
      }

      stopped = true;
      cleanupGraph();
      await releaseResources();
    },

    isRecording() {
      return started && !stopped;
    },
  };
}

function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i += 1) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
    const frac = srcIndex - srcFloor;
    result[i] = samples[srcFloor] * (1 - frac) + samples[srcCeil] * frac;
  }

  return result;
}
