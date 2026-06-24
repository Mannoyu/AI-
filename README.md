# English Reading Assistant

Developer onboarding guide for this repository.

This project is a Next.js app for English reading practice. The core flow is:

1. Enter a target word, paste English text, or upload an image
2. Extract text with OCR and open the reader
3. Click a word in the reader to generate a focused practice article
4. Practice sentence by sentence with recording and pronunciation feedback
5. Save practice history for replay and review

The goal of this document is to let a new engineer clone the repo, run it,
understand the main architecture, and know where to start making changes.

## 1. What the app does

- Home page supports three entry points:
  - target word input
  - raw English text paste
  - image upload / camera capture + OCR
- Reader page supports:
  - paragraph-based article rendering
  - clickable word tokens
  - browser TTS sentence playback
  - current-sentence highlight and auto-scroll
- Word practice page supports:
  - AI-generated multi-meaning article for a selected word
  - sentence selection for practice
  - recording, speech recognition, word-level feedback, and score
- History page supports:
  - viewing saved practice records
  - deleting one record
  - clearing all records
- Settings page supports:
  - nickname update
  - difficulty update

## 2. Tech stack

- Framework: Next.js 16.2.6
- Runtime: React 19
- Language: TypeScript
- Styling: Tailwind CSS 4
- State management: Zustand
- OCR: Tesseract.js
- Browser TTS: Web Speech API
- Speech recognition: Baidu ASR API
- Article generation: DeepSeek Chat Completions API

## 3. Important project constraints

### 3.1 This is not old-style Next.js

See [AGENTS.md](./AGENTS.md). This repo is on Next.js 16 and uses the `app`
router heavily.

Important implications:

- dynamic route `params` are promises
- client page components read them with `use(params)`
- route behavior and lint rules differ from older Next.js versions

Before making risky routing changes, check the local docs in:

```text
node_modules/next/dist/docs/
```

### 3.2 Do not assume remote fonts are available

This project no longer depends on `next/font/google` for runtime font loading.
Use the existing local/system font approach unless there is a strong reason to
change it and the deployment environment can reliably access external networks.

## 4. Local setup

### 4.1 Install dependencies

```bash
npm install
```

### 4.2 Configure environment variables

Copy [.env.example](./.env.example) to `.env.local` and fill in real values.

Required variables:

- `DEEPSEEK_API_KEY`
- `BAIDU_ASR_API_KEY`
- `BAIDU_ASR_SECRET_KEY`

### 4.3 Start the dev server

```bash
npm run dev
```

If port 3000 is already in use:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3018
```

### 4.4 Basic verification commands

```bash
npm run lint
npm run build
```

Run both before shipping changes.

## 5. Directory map

```text
src/
  app/
    api/                   Route Handlers
    history/               History page
    reader/[id]/           Reader page
    reader/[id]/word/      Word practice page
    settings/              Settings page
    layout.tsx             Global layout
    page.tsx               Home page
  components/
    history/               History list and cards
    home/                  Home page UI
    layout/                Navbar
    reader/                Reader UI
    settings/              Settings UI
    word-learn/            Practice UI
  lib/
    audio-record.ts        Browser recording wrapper
    baidu-asr.ts           Baidu ASR server helper
    history-file.ts        JSON persistence for history
    ocr.ts                 OCR wrapper
    pronunciation.ts       Alignment and scoring
    tts.ts                 Browser TTS wrapper
  stores/
    useHistoryStore.ts
    useReaderStore.ts
    useUserStore.ts
    useWordLearnStore.ts
  types/
    index.ts               Core domain types
```

Other notable directories:

- `docs/superpowers/specs/` for earlier design docs
- `.data/` for local history persistence

## 6. Route overview

### App routes

- `/`
  - home page
  - word input, paste, image OCR entry points
- `/reader/[id]`
  - main reader page
- `/reader/[id]/word?word=...&level=...`
  - generated practice page for a selected word
- `/history`
  - practice history
- `/settings`
  - nickname and difficulty settings

### API routes

- `/api/article/generate`
  - generates a multi-meaning article from DeepSeek
- `/api/speech/recognize`
  - sends recorded audio to Baidu ASR
- `/api/history`
  - list, create, and clear history records
- `/api/history/[id]`
  - delete one history record

## 7. Main data flow

### 7.1 Home page to reader

Entry file: [src/app/page.tsx](./src/app/page.tsx)

Two main paths:

- Word input or pasted text:
  - create a `ReadingMaterial`
  - store it in `useReaderStore`
- Image upload:
  - call `recognizeImage()` in the browser
  - convert OCR result into `ReadingMaterial`

The core shape is defined in
[src/types/index.ts](./src/types/index.ts) as `ReadingMaterial`.

### 7.2 Reader to word practice

Reader page:
[src/app/reader/[id]/page.tsx](./src/app/reader/[id]/page.tsx)

Key behavior:

- text is loaded from `useReaderStore`
- clicking a word opens `WordPanel`
- `WordPanel` navigates to the practice page using:

```text
/reader/<readerId>/word?word=<targetWord>&level=<difficulty>
```

### 7.3 Practice page to history

Practice page:
[src/app/reader/[id]/word/page.tsx](./src/app/reader/[id]/word/page.tsx)

Flow:

1. request `/api/article/generate`
2. select a sentence to practice
3. record audio and call `/api/speech/recognize`
4. use `pronunciation.ts` for alignment and scoring
5. save a `HistoryRecord` through `useHistoryStore.addRecord()`

## 8. State management

### `useReaderStore`

File: [src/stores/useReaderStore.ts](./src/stores/useReaderStore.ts)

Responsibilities:

- current reading material
- persisted `readerCache`
- reader restore by `readerId`

Important limitation:

- this is same-browser local recovery
- it is not a shared server-side source of truth
- opening `/reader/[id]` on another device will not fully restore the content

### `useHistoryStore`

File: [src/stores/useHistoryStore.ts](./src/stores/useHistoryStore.ts)

Responsibilities:

- front-end cache of history records
- sync with `/api/history*`
- optimistic updates

### `useUserStore`

File: [src/stores/useUserStore.ts](./src/stores/useUserStore.ts)

Responsibilities:

- nickname
- difficulty
- first-visit flag

### `useWordLearnStore`

File: [src/stores/useWordLearnStore.ts](./src/stores/useWordLearnStore.ts)

Responsibilities:

- practice page runtime state
- selected sentence
- recording state
- feedback tokens and score

## 9. OCR, TTS, and speech recognition

### OCR

File: [src/lib/ocr.ts](./src/lib/ocr.ts)

Notes:

- uses Tesseract.js
- runs in the browser
- reuses a singleton worker
- first load is relatively heavy

### TTS

File: [src/lib/tts.ts](./src/lib/tts.ts)

Notes:

- uses browser `speechSynthesis`
- no backend dependency
- only works where the browser supports Web Speech API

### Recording and ASR

Files:

- [src/lib/audio-record.ts](./src/lib/audio-record.ts)
- [src/lib/baidu-asr.ts](./src/lib/baidu-asr.ts)
- [src/app/api/speech/recognize/route.ts](./src/app/api/speech/recognize/route.ts)

Notes:

- records in the browser
- sends audio to the backend route
- backend forwards to Baidu ASR
- current path is WAV at 16kHz

When reusing recording code, make sure resources are cleaned up correctly.
The current practice flow already handles page leave, sentence switch, and
request abort paths.

## 10. Article generation contract

File:
[src/app/api/article/generate/route.ts](./src/app/api/article/generate/route.ts)

The generator is expected to produce this shape:

```ts
interface Article {
  title: string;
  content: string; // target word marked with **word**
  meanings: {
    meaning: string;
    partOfSpeech: string;
    example: string;
  }[];
  difficulty: "beginner" | "intermediate" | "advanced";
  wordCount: number;
}
```

If you change prompts, add fields, or swap models, validate all of the
following:

1. `normalizeArticle()` still accepts the response safely
2. `ArticleView` still renders `**word**` correctly
3. `HistoryRecord` still contains enough data for replay

## 11. History persistence

File: [src/lib/history-file.ts](./src/lib/history-file.ts)

Current behavior:

- persists to `.data/history.json`
- uses a write queue to serialize writes
- works well for local development and single-instance deployments

Current limitation:

- not suitable for serverless persistence
- not suitable for multi-instance shared data
- not suitable for real multi-user production storage

If this app grows beyond local/single-instance usage, move history into a real
database.

## 12. Common pitfalls

### 12.1 Route params access

In Next.js 16 client pages, this is valid:

```tsx
const { id } = use(params)
```

Do not assume older synchronous params behavior.

### 12.2 Avoid effect-driven state churn

This codebase already fixed several React 19 / ESLint issues related to
`set-state-in-effect`.

Prefer:

- derived state
- `useMemo`
- event-driven updates
- explicit async boundaries

### 12.3 Browser APIs are conditional

Do not assume these always exist:

- OCR worker support
- `speechSynthesis`
- microphone permissions
- `MediaRecorder`
- `AudioContext`

### 12.4 Reader recovery is local-only

`useReaderStore` restores content from local persisted cache. It is not a
shareable server-side reader database.

### 12.5 Do not commit real secrets

Keep real keys only in `.env.local`. Commit `.env.example`, not secrets.

## 13. Recommended workflow for changes

### If you are changing reader UX

Start with:

1. `src/app/reader/[id]/page.tsx`
2. `src/components/reader/*`
3. `src/stores/useReaderStore.ts`
4. `src/lib/tts.ts`

### If you are changing the practice flow

Start with:

1. `src/app/reader/[id]/word/page.tsx`
2. `src/components/word-learn/*`
3. `src/lib/pronunciation.ts`
4. `src/app/api/article/generate/route.ts`
5. `src/app/api/speech/recognize/route.ts`

### If you are changing history behavior

Start with:

1. `src/app/history/page.tsx`
2. `src/components/history/*`
3. `src/stores/useHistoryStore.ts`
4. `src/lib/history-file.ts`
5. `src/app/api/history/*`

## 14. Pre-merge checklist

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] At least one home-page entry path still works
- [ ] Reader word selection still navigates correctly
- [ ] Practice page can select a sentence, record, and score
- [ ] History page shows the new record
- [ ] No obvious mobile overflow or blocked UI

## 15. Known limitations and next upgrades

High-value future upgrades:

1. move reading materials from local cache to server-side persistence
2. move history from `.data/history.json` to a database
3. add filtering, grouping, and metrics on the history page
4. add stronger progress guidance on the practice page
5. clean remaining legacy mojibake strings in a few server-side files

## 16. Additional references

- Design specs:
  - [docs/superpowers/specs/2026-05-30-english-reading-assistant-design.md](./docs/superpowers/specs/2026-05-30-english-reading-assistant-design.md)
  - [docs/superpowers/specs/2026-05-30-ocr-reader-flow-design.md](./docs/superpowers/specs/2026-05-30-ocr-reader-flow-design.md)
  - [docs/superpowers/specs/2026-05-30-tts-reading-design.md](./docs/superpowers/specs/2026-05-30-tts-reading-design.md)
- Local Next.js docs:
  - `node_modules/next/dist/docs/`

## 17. Suggested first-day path for a new engineer

1. Read this README
2. Run `npm run dev`
3. Walk the flow:
   - home page
   - reader
   - practice page
   - history page
4. Then open the page, component, store, and API files for the feature you want
   to change
