/**
 * Browser-side OCR utility using Tesseract.js.
 *
 * Recognizes English text from an image (file, data URL, or canvas).
 * Tesseract.js runs entirely in the browser via WebAssembly — no server needed.
 */

import { createWorker, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;
/** Latest progress callback — always referenced by the shared worker logger. */
let currentOnProgress: ((progress: OcrProgress) => void) | undefined;

export interface OcrProgress {
  /** Current processing stage */
  status: string;
  /** Progress 0–1 */
  progress: number;
}

/**
 * Get or create a singleton Tesseract.js worker for English.
 * Reusing the worker avoids reloading the language model on each call.
 */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      logger: (info) => {
        currentOnProgress?.({
          status: info.status || "",
          progress: typeof info.progress === "number" ? info.progress : 0,
        });
      },
    });
  }
  return workerPromise;
}

/**
 * Recognize English text from an image.
 *
 * @param image - Image source: data URL, file, canvas, or <img> element
 * @param onProgress - Optional callback for progress updates
 * @returns Recognized text string
 */
export async function recognizeImage(
  image: string | File | HTMLCanvasElement | HTMLImageElement,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  currentOnProgress = onProgress;
  const worker = await getWorker();

  const {
    data: { text },
  } = await worker.recognize(image);

  return text.trim();
}

/**
 * Terminate the worker to free resources.
 * Call when OCR is no longer needed (e.g., page unmount).
 */
export async function terminateWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
