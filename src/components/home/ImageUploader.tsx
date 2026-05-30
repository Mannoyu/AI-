"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Camera, Upload, ImageIcon, X } from "lucide-react";

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="terminal-card p-6">
      <h2
        className="text-xl font-semibold mb-4"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        上传英文文本图片
      </h2>

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
          className={`terminal-inset rounded-2xl p-10 text-center transition-all duration-200 ${
            dragging ? "ring-2 ring-primary scale-[1.02]" : ""
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-text font-medium mb-1">
                拖拽图片到这里，或点击下方按钮
              </p>
              <p className="text-sm text-text-muted">
                支持 JPG、PNG，建议文字清晰、光线充足
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <label
                htmlFor="image-upload"
                className="terminal-btn flex items-center gap-2 px-5 py-2.5 bg-primary/15 text-primary text-sm"
              >
                <Upload className="w-4 h-4" />
                上传图片
              </label>
              <label
                htmlFor="image-upload"
                className="terminal-btn flex items-center gap-2 px-5 py-2.5 bg-cta/15 text-cta text-sm"
                onClick={() => {
                  if (fileRef.current) fileRef.current.setAttribute("capture", "environment");
                }}
              >
                <Camera className="w-4 h-4" />
                拍照
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="上传图片预览"
            className="w-full max-h-64 object-contain rounded-2xl bg-surface-alt"
          />
          <button
            onClick={clearPreview}
            disabled={loading}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/90 shadow-terminal flex items-center justify-center hover:shadow-terminal-hover transition-all duration-200 disabled:opacity-50"
          >
            <X className="w-4 h-4 text-text" />
          </button>

          {loading && (
            <div className="absolute inset-0 bg-surface/60 rounded-2xl flex items-center justify-center">
              <div className="flex items-center gap-3 terminal-card px-5 py-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
