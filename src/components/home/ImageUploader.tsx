"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Camera, ImageIcon, Upload, X } from "lucide-react";

interface ImageUploaderProps {
  onImage: (file: File, dataUrl: string) => void;
  loading: boolean;
}

export function ImageUploader({ onImage, loading }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onImage(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processFile(file);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="terminal-card p-6">
      <div className="mb-4">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          导入英文材料
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          支持拍照、拖拽或上传图片，识别完成后会生成可进入阅读器的文本材料。
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragging(false)}
          aria-busy={loading}
          className={`terminal-inset rounded-2xl p-10 text-center transition-all duration-200 ${
            dragging ? "scale-[1.01] ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="mb-1 font-medium text-text">
                把图片拖到这里，或使用下方按钮选择文件
              </p>
              <p className="text-sm text-text-muted">
                支持 JPG、PNG。建议画面平整、文字清晰、光线充足。
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-3">
              <label
                htmlFor="image-upload"
                className="terminal-btn flex min-h-11 items-center gap-2 bg-primary/15 px-5 py-2.5 text-sm text-primary"
              >
                <Upload className="h-4 w-4" />
                上传图片
              </label>
              <label
                htmlFor="image-upload"
                className="terminal-btn flex min-h-11 items-center gap-2 bg-cta/15 px-5 py-2.5 text-sm text-cta"
                onClick={() => {
                  fileRef.current?.setAttribute("capture", "environment");
                }}
              >
                <Camera className="h-4 w-4" />
                拍照
              </label>
            </div>
            <div className="mt-2 grid w-full max-w-xl gap-2 text-left text-xs text-text-light sm:grid-cols-3">
              <div className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-3 py-2">
                适合教材页、截图、打印材料
              </div>
              <div className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-3 py-2">
                识别前会先展示预览，方便确认内容
              </div>
              <div className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-3 py-2">
                首次 OCR 会稍慢，加载完成后会更快
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="上传图片预览"
            className="max-h-64 w-full rounded-2xl bg-surface-alt object-contain"
          />
          <button
            onClick={clearPreview}
            disabled={loading}
            aria-label="移除当前图片"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-terminal transition-all duration-200 hover:shadow-terminal-hover disabled:opacity-50"
          >
            <X className="h-4 w-4 text-text" />
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/60 px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-text">图片已就绪</p>
              <p className="mt-1 text-text-muted">
                OCR 会提取其中的英文文本，并生成可继续阅读的材料。
              </p>
            </div>
            <button
              onClick={clearPreview}
              disabled={loading}
              className="terminal-btn px-4 py-2 text-text-muted hover:text-text"
            >
              重新选择
            </button>
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/60">
              <div className="terminal-card flex items-center gap-3 px-5 py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-medium text-text">
                  正在识别文字...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
