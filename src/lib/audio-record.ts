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
  /** Returns the WAV blob and the full Float32Array of recorded samples. */
  stop(): Promise<{ blob: Blob; samples: Float32Array }>;
  isRecording(): boolean;
}

/**
 * Encode Float32 PCM samples to a WAV ArrayBuffer (16-bit PCM, mono).
 */
// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const byteCount = samples.length * 2;
  const buffer = new ArrayBuffer(44 + byteCount);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + byteCount, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, byteCount, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeAscii(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export interface AudioRecorderOptions {
  targetSampleRate?: number;
  /** Called with the latest chunk of samples for live waveform display. */
  onSamples?: (samples: Float32Array) => void;
}

/**
 * Create an audio recorder that captures from the microphone.
 * Uses AudioContext + ScriptProcessorNode for raw PCM access.
 * On stop(), returns a WAV Blob and the full audio samples.
 */
export async function createAudioRecorder(
  options: AudioRecorderOptions = {}
): Promise<AudioRecorder> {
  const { targetSampleRate = 16000, onSamples } = options;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext({ sampleRate: targetSampleRate });
  const source = audioCtx.createMediaStreamSource(stream);
  const actualRate = audioCtx.sampleRate;

  // Store all recorded samples for waveform snapshot and WAV encoding
  const allSamples: number[] = [];
  let scriptNode: ScriptProcessorNode | null = null;

  const recorder: AudioRecorder = {
    async start(): Promise<void> {
      allSamples.length = 0;

      scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);

      scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
        const input = event.inputBuffer.getChannelData(0);
        // Copy samples for waveform (use every Nth sample to reduce data)
        const chunk = Array.from(input);
        for (const s of chunk) allSamples.push(s);
        // Notify listener for live waveform
        if (onSamples) {
          onSamples(input);
        }
      };

      source.connect(scriptNode);
      scriptNode.connect(audioCtx.destination);
    },

    async stop(): Promise<{ blob: Blob; samples: Float32Array }> {
      // Stop the source first — no more audio
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());

      // Wait for the ScriptProcessor to flush its buffer
      await new Promise((r) => setTimeout(r, 300));

      if (scriptNode) {
        scriptNode.disconnect();
        scriptNode = null;
      }
      await audioCtx.close();

      console.log(`[AudioRecorder] Total samples: ${allSamples.length}`);

      if (allSamples.length === 0) {
        // Return minimal silent WAV instead of empty
        const silent = new Float32Array(1600); // 100ms of silence
        const wavBuffer = encodeWAV(silent, targetSampleRate);
        console.warn("[AudioRecorder] No audio captured, returning silence");
        return {
          blob: new Blob([wavBuffer], { type: "audio/wav" }),
          samples: silent,
        };
      }

      const combined = new Float32Array(allSamples);

      // Resample if needed
      let samples: Float32Array = combined;
      if (actualRate !== targetSampleRate) {
        samples = resample(combined, actualRate, targetSampleRate);
      }

      const wavBuffer = encodeWAV(samples, targetSampleRate);
      return {
        blob: new Blob([wavBuffer], { type: "audio/wav" }),
        samples,
      };
    },

    isRecording(): boolean {
      return scriptNode !== null;
    },
  };

  return recorder;
}

/** Simple linear resampling. */
function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
    const frac = srcIndex - srcFloor;
    result[i] = samples[srcFloor] * (1 - frac) + samples[srcCeil] * frac;
  }

  return result;
}
