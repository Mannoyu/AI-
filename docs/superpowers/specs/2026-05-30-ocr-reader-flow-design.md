# OCR → Reader Flow Wiring

**Date:** 2026-05-30
**Status:** approved
**Scope:** Single-file fix — `src/app/reader/[id]/page.tsx`

## Problem

[reader/[id]/page.tsx](../../src/app/reader/[id]/page.tsx) hardcodes `const reader = MOCK_READER`. Users who upload an image, run OCR, and click "进入阅读" always see mock data, not their recognized text.

## Root Cause

The Reader page reads from `MOCK_READER` (a static import) instead of `useReaderStore` (the Zustand store where OCR results are saved by the home page).

## Design

### Data Flow

```
Home Page (page.tsx)
  │  User uploads image
  │  recognizeImage() → text
  │  setReader(result) → useReaderStore.currentReader
  │  User clicks "进入阅读" → router.push(/reader/${id})
  ▼
Reader Page (reader/[id]/page.tsx)   <-- CURRENTLY BROKEN
  │  Reads useReaderStore.currentReader
  │  Matches id param to currentReader.id
  │  Renders actual OCR text via TextDisplay
  ▼
TextDisplay + WordPanel
  │  User clicks a word → router.push(/reader/${id}/word?word=...)
  │  AI generates article → PronunciationPanel
  │  Auto-saves to History
```

### Implementation

**File changed:** `src/app/reader/[id]/page.tsx`

1. Remove `import { MOCK_READER } from "@/data/mock"`
2. Import `useReaderStore` and `useRouter` (already imported)
3. Replace `const reader = MOCK_READER` with:

```tsx
const { currentReader } = useReaderStore();

// Match store data to URL param, or show fallback
const readerMatches = currentReader && currentReader.id === id;

if (!readerMatches) {
  // Fallback UI — user landed on this URL directly without OCR data
  return <FallbackView id={id} />;
}

const reader = currentReader;
```

4. Extract a `FallbackView` component for the no-data case:

```tsx
function FallbackView({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="terminal-card p-8 text-center max-w-md">
        <FileQuestion className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text font-medium mb-2">未找到阅读内容</p>
        <p className="text-sm text-text-muted mb-6">
          请从首页上传图片进行 OCR 识别，或输入单词开始学习
        </p>
        <button onClick={() => router.push("/")} className="terminal-btn ...">
          返回首页
        </button>
      </div>
    </div>
  );
}
```

### Edge Cases

| Case | Behavior |
|------|----------|
| Store has matching `id` | Render normally with OCR text |
| Store is `null` (direct URL visit) | Show FallbackView with "返回首页" |
| Store has different `id` (stale data) | Show FallbackView with "返回首页" |

### What This Does NOT Change

- OCR library (`src/lib/ocr.ts`) — untouched
- ImageUploader, OCRResultPreview — untouched
- Store (`useReaderStore`) — untouched, already persists correctly
- WordPanel, TextDisplay — untouched, already accept dynamic data via props
- `MOCK_READER` is NOT deleted from `src/data/mock.ts` — it may be used elsewhere or as reference
