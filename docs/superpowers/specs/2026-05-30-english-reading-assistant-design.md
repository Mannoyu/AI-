# AI 英语朗读助手 — 项目总览

> 最后更新: 2026-05-30
> 状态: 已完成

## 概述

一个基于 Next.js 16 App Router 的 Web 英语学习工具。核心流程：

**拍照/粘贴英文文本 → OCR 提取全文 → 点击任意单词 → AI 生成多语义文章 → 录音跟读 → 逐词发音反馈（绿/红） + 评分 → 自动保存学习记录**

额外功能：AI 朗读全文（TTS），带句子级高亮跟随。

---

## 技术栈

| 分层 | 技术 | 实际用途 |
|------|------|----------|
| 框架 | Next.js 16.2 App Router + React 19.2 + TypeScript 5 | 全栈框架 |
| 样式 | Tailwind CSS 4 | Matrix Green 暗色终端主题 |
| 状态管理 | Zustand 5 (含 persist 中间件) | 4 个 store (user/reader/wordLearn/history) |
| AI 文章生成 | DeepSeek Chat API (`deepseek-chat`) | POST `/api/article/generate`，JSON 模式返回 |
| 语音识别 (ASR) | 百度语音识别 API (服务端) | POST `/api/speech/recognize`，接收 WAV blob |
| 语音合成 (TTS) | 浏览器 Web Speech API (`SpeechSynthesis`) | 客户端逐句朗读 + 句子级高亮 |
| OCR | Tesseract.js v7 (浏览器 WASM) | Singleton worker，英语语言包 (~4MB) |
| 录音 | Web Audio API + ScriptProcessorNode | PCM 16kHz 单声道 → WAV 编码 |
| 波形可视化 | Canvas 2D (自绘) | 80 柱实时波形 + 录音回放波形 + 扫描动画 |
| 发音比对 | Levenshtein 编辑距离 + 滑动窗口对齐 | 原始句 vs ASR 识别文本 → 逐词 correct/incorrect |
| 历史存储 | 服务端 JSON 文件 | `.data/history.json`，原子写入 (tmp+rename)，写入队列 |
| 字体 | JetBrains Mono (Google Fonts) | 等宽终端风格 |
| 图标 | Lucide React | 统一的 SVG 图标库 |

**依赖包清单：** `next` `react` `react-dom` `typescript` `tailwindcss` `zustand` `tesseract.js` `lucide-react` `recharts`(未使用) `wavesurfer.js`(未使用)

---

## 页面 & 路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 选难度 → 输入单词 / 粘贴文本 / 上传图片 → OCR |
| `/reader/[id]` | 读者页 | OCR 文本 + 点击单词 + AI 朗读 (ReadingBar) |
| `/reader/[id]/word` | 跟读练习页 | AI 多语义文章 + 录音跟读 + 波形 + 逐词反馈 |
| `/history` | 历史记录 | 学习记录列表，支持删除单条 |
| `/settings` | 设置 | 修改英语等级 |

---

## 组件树

```
Layout (Navbar + page-frame)
│
├── HomePage (/)
│   ├── LevelSelector          — 首次访问选等级 (初级/中级/高级)
│   ├── WordInput              — 直接输入单词 → /reader/direct/word
│   ├── PasteTextSection       — 粘贴英文文本 → 创建 reader → /reader/[id]
│   ├── ImageUploader          — 拖拽/拍照/上传图片
│   └── OCRResultPreview       — OCR 结果预览 + 进入阅读按钮
│
├── ReaderPage (/reader/[id])
│   ├── ReadingBar             — AI 朗读控制栏 (播放/暂停/停止 + 语速 0.5x~1.5x)
│   ├── TextDisplay            — 全文展示 + 句子级朗读高亮
│   │   └── WordToken          — 可点击的单词 (hover 高亮)
│   └── WordPanel              — 侧栏: 选中单词 + 生成文章按钮
│
├── WordLearnPage (/reader/[id]/word)
│   ├── ArticleView            — AI 多语义文章 (目标词加粗)
│   │   └── SemanticBadges     — 语义标签 (银行/河岸/信赖...)
│   ├── PronunciationPanel     — 跟读练习面板
│   │   ├── RecordButton       — 录音按钮 (idle/recording/processing/done)
│   │   ├── WaveformDisplay    — Canvas 实时波形 + 录音回放 (+ 得分叠加)
│   │   └── WordFeedback       — 逐词绿/红/金色高亮反馈
│   └── (自动保存) → useHistoryStore → .data/history.json
│
├── HistoryPage (/history)
│   └── HistoryList
│       └── HistoryCard        — 单词、得分、错误词、时间
│
└── SettingsPage (/settings)
    └── LevelConfig            — 修改英语等级
```

---

## Zustand Store

| Store | 持久化 | 关键字段 |
|-------|--------|---------|
| `useUserStore` | localStorage | `profile.level`, `isFirstVisit` |
| `useReaderStore` | 内存 | `currentReader`, `ocrLoading`, `ocrError` |
| `useWordLearnStore` | 内存 | `article`, `recordingState`, `selectedSentence`, `feedbackTokens`, `score` |
| `useHistoryStore` | localStorage + API 同步 | `records[]`, `loading`, `error` |

**History store 同步策略：** 乐观更新 (optimistic update) + API 调用失败时回滚。`loadRecords()` 合并服务端 + 本地记录去重。

---

## API Routes

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/article/generate` | POST | DeepSeek 生成多语义文章 (JSON 模式，30s 超时) |
| `/api/speech/recognize` | POST | 百度 ASR 语音识别 (16kHz WAV) |
| `/api/history` | GET | 读取所有学习记录 |
| `/api/history` | POST | 新增一条学习记录 |
| `/api/history` | DELETE | 清空所有记录 |
| `/api/history/[id]` | DELETE | 删除指定记录 |

---

## 核心数据流

```
┌─ 方式 A: 粘贴文本 ───────────────────────────────────────┐
│  首页 → 粘贴英文文本 → setReader() → /reader/[id]         │
└──────────────────────────────────────────────────────────┘

┌─ 方式 B: 拍照 OCR ───────────────────────────────────────┐
│  首页 → ImageUploader → Tesseract.js OCR (浏览器 WASM)   │
│  → 提取文本 → setReader() → /reader/[id]                  │
└──────────────────────────────────────────────────────────┘

┌─ 读者页面 ───────────────────────────────────────────────┐
│  → TextDisplay: 全文展示，单词可点击                       │
│  → ReadingBar: AI 逐句朗读 + 句子高亮跟随                  │
│  → 点击单词 → WordPanel → "生成学习文章"                   │
│  → POST /api/article/generate { word, level }              │
│  → DeepSeek 返回 JSON Article                             │
└──────────────────────────────────────────────────────────┘

┌─ 跟读练习页 ─────────────────────────────────────────────┐
│  → ArticleView: 多语义文章展示                             │
│  → 点击句子 → PronunciationPanel                          │
│  → RecordButton → Web Audio 录音 (16kHz PCM)              │
│  → WaveformDisplay: Canvas 实时波形 (ref 驱动，60fps)     │
│  → stop() → WAV blob → POST /api/speech/recognize          │
│  → 百度 ASR 返回文本                                       │
│  → Levenshtein 逐词对齐 → 绿(对) / 红(错) / 金(目标词)    │
│  → 评分 = 正确词/总词 × 100                                │
│  → 自动保存到 .data/history.json                          │
└──────────────────────────────────────────────────────────┘
```

---

## 设计系统: Matrix Green

| Token | 值 |
|-------|----|
| `--color-primary` | `#00FF41` |
| `--color-bg` | `#0D1117` |
| `--color-surface` | `#161B22` |
| `--color-text` | `#E6EDF3` |
| `--color-text-muted` | `#8B949E` |
| `--color-error` | `#FF3355` |
| `--color-warning` | `#FFB800` |
| `--font-heading` | JetBrains Mono |

工具类: `terminal-card` / `terminal-inset` / `terminal-btn` / `text-glow` / `scanline` / `page-frame`

---

## 文件结构

```
src/
├── app/
│   ├── layout.tsx                    # 根布局 + 字体 + metadata
│   ├── globals.css                   # 设计系统 + 工具类
│   ├── page.tsx                      # 首页
│   ├── api/
│   │   ├── article/generate/route.ts # DeepSeek LLM
│   │   ├── speech/recognize/route.ts # 百度 ASR
│   │   └── history/
│   │       ├── route.ts              # GET/POST/DELETE
│   │       └── [id]/route.ts         # DELETE single
│   ├── reader/[id]/
│   │   ├── page.tsx                  # 读者页 + ReadingBar
│   │   └── word/page.tsx             # 跟读练习页
│   ├── history/page.tsx              # 学习记录
│   └── settings/page.tsx             # 设置
├── components/
│   ├── home/                         # LevelSelector, ImageUploader, WordInput, OCRResultPreview
│   ├── reader/                       # ReadingBar, TextDisplay, WordPanel, WordToken
│   ├── word-learn/                   # ArticleView, PronunciationPanel, RecordButton, WaveformDisplay, WordFeedback, SemanticBadges
│   ├── history/                      # HistoryList, HistoryCard
│   ├── settings/                     # LevelConfig
│   └── layout/                       # Navbar
├── lib/
│   ├── ocr.ts                        # Tesseract.js singleton worker
│   ├── tts.ts                        # Web Speech API TTS (逐句朗读)
│   ├── audio-record.ts              # Web Audio API 录音 + WAV 编码
│   ├── baidu-asr.ts                  # 百度 ASR (OAuth token + 识别)
│   ├── pronunciation.ts             # Levenshtein 对齐 + 评分
│   └── history-file.ts              # 服务端 JSON 文件读写
├── stores/
│   ├── useUserStore.ts              # 用户等级 (persist)
│   ├── useReaderStore.ts            # 阅读材料 (内存)
│   ├── useWordLearnStore.ts         # 学习状态 (内存)
│   └── useHistoryStore.ts           # 历史记录 (persist + API)
├── types/
│   └── index.ts                     # 全部 TypeScript 类型
└── data/
    └── mock.ts                      # 开发用 mock 数据
```

---

## 关键实现细节

### OCR (`lib/ocr.ts`)
- Tesseract.js v7 singleton worker (`createWorker('eng', 1, { logger })`)
- Module-level `currentOnProgress` 变量解决闭包陈旧问题
- 支持 data URL / File / Canvas / Image 输入

### 录音 (`lib/audio-record.ts`)
- `createAudioRecorder({ targetSampleRate: 16000, onSamples })`
- `ScriptProcessorNode` (4096 buffer) 捕获原始 PCM
- `stop()` 返回 `{ blob: WAV, samples: Float32Array }`
- `onSamples` 回调提供实时波形数据 (通过 ref 传递，不触发 React re-render)
- 线性重采样 (如需)
- 空录音返回 100ms 静音 WAV

### 波形 (`WaveformDisplay.tsx`)
- Canvas 2D，DPR 感知渲染
- 性能关键: ref 驱动 (非 state)、fillRect 而非路径、ResizeObserver 缓存尺寸、颜色查找表、stride 采样
- 三态: 实时 (录音中) / 扫描动画 (分析中) / 静态回放 (完成)

### 发音比对 (`lib/pronunciation.ts`)
- `alignWords(originalWords, spokenWords, targetWord)`
- 滑动窗口 (i-2 到 i+3) 搜索匹配
- 精确匹配 或 Levenshtein ≤ 1 为 correct
- `calculateScore(tokens)` = correct/总数 × 100

### TTS (`lib/tts.ts`)
- `createTtsReader(sentences, { rate, onSentenceChange, onEnd })`
- Chrome 兼容: play() 前 cancel() 重置 + setTimeout 延迟 + 保持 utterance 引用防 GC
- 支持 pause/resume/stop/setRate

### 历史存储 (`lib/history-file.ts`)
- `.data/history.json`，原子写入 (tmp 文件 + rename)
- 写入队列序列化并发

---

## 异常处理

| 场景 | 处理 |
|------|------|
| OCR 识别无文字 | 提示"未识别到文字，请确认图片清晰" |
| DeepSeek API 超时/异常 | 30s 超时 + 错误提示 + 重试按钮 |
| 百度 ASR 失败 | 区分 no-speech / asr-failed / mic-denied |
| 麦克风权限拒绝 | 引导用户去浏览器设置开启 |
| 录音无声音 | blob size < 44 字节检测 → 提示"未检测到语音" |
| 空句子 (TTS) | `splitToSentences` 过滤空串，ReadingBar 返回 null |
| SpeechSynthesis 不支持 | ReadingBar 隐藏 |
| 读者页无匹配数据 | Fallback 页面 + 返回首页 |
| History API 失败 | 乐观更新回滚 + 本地 recovery |
