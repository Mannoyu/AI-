# AI TTS Reading — Reader Page

**Date:** 2026-05-30
**Status:** approved
**Scope:** New TTS lib + ReadingBar component + TextDisplay highlight

## Problem

Users can view OCR-extracted English text on the reader page, but have no way to hear it read aloud. Adding AI-powered text-to-speech helps users learn correct pronunciation of the full passage.

## Solution

Browser-native Web Speech API (`SpeechSynthesis`) — free, zero-config, good English quality.

### Architecture

```
Reader Page (reader/[id]/page.tsx)
  │
  ├── ReadingBar          ← NEW
  │     Play / Pause / Stop + Speed selector
  │     Uses lib/tts.ts
  │
  ├── TextDisplay          ← MODIFY
  │     + highlightSentenceIndex prop
  │     Sentence-level highlight during TTS
  │
  └── lib/tts.ts           ← NEW
        Web Speech API wrapper
        speakText / pause / resume / stop
        onSentenceChange callback
```

## Files

### NEW: `src/lib/tts.ts`

```ts
interface TtsOptions {
  sentences: string[];
  rate?: number;        // 0.5 ~ 1.5, default 1.0
  onSentenceChange?: (index: number) => void;
  onEnd?: () => void;
}

interface TtsController {
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  getState(): 'idle' | 'playing' | 'paused';
}
```

- Uses `window.speechSynthesis`
- Speaks sentences sequentially via `utterance.onend` chaining
- `onSentenceChange(index)` fires when moving to sentence N
- `onEnd()` fires when all sentences are spoken
- Handles edge case: `speechSynthesis.cancel()` on stop

### NEW: `src/components/reader/ReadingBar.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│  🔊 AI 朗读  │  [▶️] [⏸] [⏹]  │  语速: 1x ▼  │               │
└─────────────────────────────────────────────────────────────────┘
```

Props:
- `sentences: string[]` — text split by sentence
- `highlightSentenceIndex: number | null`
- `onHighlightChange: (index: number | null) => void`

State: `idle | playing | paused`
- Idle: only Play enabled
- Playing: Pause + Stop enabled, green pulse on speaker icon
- Paused: Play (resume) + Stop enabled

Speed options: 0.5x, 0.75x, 1x, 1.25x, 1.5x — dropdown selector

### MODIFY: `src/components/reader/TextDisplay.tsx`

New optional prop:
```ts
highlightSentenceIndex?: number | null
```

When set, the sentence at that index gets:
- `bg-primary/10` background
- `border-l-2 border-primary` left accent
- Smooth CSS transition between sentences

Text is split by sentence boundaries (`.!?`) for highlighting regions.

### MODIFY: `src/app/reader/[id]/page.tsx`

- Split `reader.ocrText` into sentences via regex
- Add ReadingBar below the title, above TextDisplay
- Manage `currentSentenceIndex` state
- Pass `highlightSentenceIndex` to TextDisplay

## Edge Cases

| Case | Behavior |
|------|----------|
| Browser doesn't support SpeechSynthesis | Hide ReadingBar entirely |
| No English voices available | Hide ReadingBar, console.warn |
| User clicks Play while already playing | No-op (button disabled) |
| User navigates away while playing | `stop()` in useEffect cleanup |
| Empty text / no sentences | Hide ReadingBar |
| Very long text (>100 sentences) | Still works, but consider chunking in v2 |

## What This Does NOT Do (v1)

- Word-level highlighting (requires `onboundary`, unreliable across browsers)
- Voice/language picker (uses default English voice)
- Server-side TTS fallback
- Reading progress persistence
