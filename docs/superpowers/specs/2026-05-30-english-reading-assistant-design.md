# English Reading Assistant — Design Spec

> 日期: 2026-05-30
> 状态: Draft

## 概述

一个 Web 英语朗读助手。用户拍照上传英文文本 → OCR 提取全文 → 点击任意单词 → AI 生成一篇围绕该单词的多语义文章 → 用户自由跟读练习 → 逐词发音反馈（绿/红高亮）。

---

## 技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| AI 服务策略 | 成本优先 | 国产 LLM + 浏览器原生 Web Speech API |
| 朗读交互 | 自由朗读 | 不限顺序，用户任意选择句子跟读 |
| OCR 场景 | 拍照提取全文 + 点击取词 | 对应课本/阅读材料学习场景 |
| 难度获取 | 首次自评 | 用户选择初级/中级/高级 |
| 发音反馈 | 逐词高亮 | 绿=准确，红=不准确 |
| 多义处理 | 一篇多义文章 | 同一文章内自然体现 3-5 次不同含义 |
| 架构 | 纯前端为主 | OCR + 语音 浏览器本地完成，服务端仅 LLM + 存储 |

---

## 技术栈

| 分层 | 技术 |
|------|------|
| 核心框架 | Next.js 15 + React 18 + TypeScript |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 服务端 | Next.js API Routes (Node.js) |
| 数据存储 | 服务端 JSON 文件（按月拆分） |
| 流式交互 | SSE |
| OCR | Tesseract.js（浏览器端） |
| TTS / ASR | Web Speech API（浏览器端） |
| 波形可视化 | wavesurfer.js |
| AI 服务 | DeepSeek / 通义千问 LLM |
| 工程化 | ESLint、Prettier、Vitest、Playwright |

---

## 页面结构 & 路由

```
/                    → 首页（拍照入口 + 自评定级）
/reader/[id]        → 阅读器页（OCR 提取的文本，单词可点击）
/reader/[id]/word   → 单词学习页（AI 文章 + 跟读练习）
/history             → 学习记录列表
/settings            → 设置（修改等级、关于）
```

---

## 组件树

```
Layout (顶部导航栏)
├── HomePage
│   ├── LevelSelector        — 自评定级（初级/中级/高级）
│   ├── ImageUploader        — 拍照/上传图片
│   └── OCRResultPreview     — OCR 提取文本预览
│       └── ReadingMaterialCard — 生成阅读材料卡片
│
├── ReaderPage
│   ├── TextDisplay          — 全文展示，每个词可点击
│   │   └── WordToken        — 可点击的单词
│   └── WordPanel            — 侧栏：选中单词信息
│       └── GenerateButton   — 跳转到单词学习页入口
│
├── WordLearnPage            — 核心学习页面
│   ├── ArticleView          — AI 多义文章（目标词加粗）
│   │   └── WordToken        — 可点击听发音
│   ├── SemanticBadges       — 单词多义标签
│   ├── PronunciationPanel   — 跟读练习面板
│   │   ├── RecordButton     — 录音按钮
│   │   ├── WaveformDisplay  — wavesurfer.js 波形
│   │   └── WordFeedback     — 逐词绿/红高亮反馈
│
├── HistoryPage
│   └── HistoryList
│       └── HistoryCard      — 每次学习摘要卡片
│
└── SettingsPage
    └── LevelConfig          — 修改英语等级
```

---

## Zustand Store 设计

```
stores/
├── useUserStore        — 用户等级、昵称（持久化 localStorage）
├── useReaderStore      — 当前阅读材料、OCR 文本、选中单词
├── useWordLearnStore   — AI 文章、录音状态、发音反馈
└── useHistoryStore     — 学习记录列表
```

**核心数据流（拍图 → 学词）：**

```
用户拍照上传
  → Tesseract.js OCR（浏览器端）
  → OCR 文本存入 useReaderStore
  → 用户点击单词 "bank"
  → POST /api/article/generate { word: "bank", level: "intermediate" }
  → SSE 流式返回文章（边生成边展示）
  → 文章存入 useWordLearnStore
  → 用户录音 → Web Speech API 识别
  → 逐词比对 → WordFeedback 绿/红渲染
  → 学习记录存入 useHistoryStore
```

---

## API Routes

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/article/generate` | POST | 调用 LLM 流式生成多义文章 (SSE) |
| `/api/history` | POST | 保存学习记录 |
| `/api/history` | GET | 获取历史记录列表 |

服务端仅做两件事：**调用 LLM**、**读写 JSON 文件**。OCR 和语音全部在浏览器完成。

---

## LLM Prompt 设计

**System Prompt:**

```
你是一个英语教学专家。根据用户提供的单词和英语等级，
生成一篇约150-300字的英文文章。

要求：
1. 文章自然流畅，该单词在文章中至少出现 3-5 次，每次体现不同语义
2. 用 **{word}** 标记目标单词的每次出现
3. 根据等级调整词汇量和句式复杂度：
   - 初级（beginner）：高中词汇、简单句、80-120字
   - 中级（intermediate）：四级词汇、复合句、150-200字
   - 高级（advanced）：六级+词汇、复杂句式、200-300字
4. 文章末尾附上该单词在文中出现的各语义解释（中文）

返回 JSON：
{
  "title": "string",
  "content": "markdown 格式，目标词用 **加粗**",
  "meanings": [
    { "meaning": "中文解释", "partOfSpeech": "词性", "example": "文中原句" }
  ],
  "difficulty": "beginner | intermediate | advanced",
  "wordCount": 150
}
```

---

## 发音比对策略

**算法：文本级逐词比对**（非音频声学分析）

1. 用户点击录音按钮 → MediaRecorder 录音 + Web Speech API 实时识别（SpeechRecognition）
2. 得到用户 ASR 文本后，与用户选中的原文句子做 **Levenshtein 逐词对齐**
3. 比对规则：
   - ASR 词与原文词精确匹配（忽略大小写）→ 绿色高亮
   - ASR 词与原文词不匹配 / 漏读 / 未识别 → 红色高亮
   - 目标单词（生词）匹配 → 金色边框特别标记
4. **评分**：匹配词数 / 原文总词数 × 100，存入 `pronunciationScore`
5. wavesurfer.js 展示用户录音波形 + TTS 生成的标准发音波形对比
6. 不强制顺序，用户可反复练习任意句子

---

## 异常处理

| 场景 | 处理 |
|------|------|
| OCR 识别质量差 | 提示重拍，建议光线充足、文字清晰 |
| LLM API 超时/限流 | 骨架屏 loading，30s 超时提示重试 |
| Web Speech API 不可用 | 检测 `webkitSpeechRecognition`，提示用 Chrome |
| 录音无声音 | 波形幅值检测，波平 → 提示"未检测到声音，请重试" |
| 文章中出现非英语 token | 前端过滤，不参与发音比对 |
| JSON 文件过大 | 按月拆分 `history-2026-05.json`，单文件上限 500 条记录 |
| 图片过大 | 前端压缩至 1920px 宽度后送 OCR |

---

## 数据库 JSON 结构

### 阅读材料（reader）

```json
// data/readers/reader-{timestamp}.json
{
  "id": "r_1717000000000",
  "ocrText": "The full extracted text...",
  "title": "从 OCR 文本首行截取",
  "createdAt": "2026-05-30T10:00:00Z",
  "imageDataUrl": "base64..."  // 可选，压缩后的缩略图
}
```

### 学习记录（history）

```json
// data/history/history-2026-05.json
[
  {
    "id": "h_1717000000000",
    "readerId": "r_1717000000000",
    "word": "bank",
    "articleTitle": "The Many Faces of Bank",
    "articleContent": "...",
    "meanings": [
      { "meaning": "银行", "partOfSpeech": "n.", "example": "..." },
      { "meaning": "河岸", "partOfSpeech": "n.", "example": "..." }
    ],
    "pronunciationScore": 85,
    "incorrectWords": ["bank", "financial"],
    "createdAt": "2026-05-30T10:30:00Z"
  }
]
```

---

## 非功能需求

- **性能**: 首页 LCP < 2s, 文章 SSE 首字节 < 3s
- **兼容性**: Chrome 90+, Edge 90+（Web Speech API 支持）
- **响应式**: 桌面端优先，移动端基本可用
- **隐私**: OCR 和录音均在浏览器本地处理，不上传原始图片和音频到服务端
- **国际化**: 界面中文，学习内容英文
