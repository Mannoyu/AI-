import type {
  ReadingMaterial,
  HistoryRecord,
  Article,
} from "@/types";

/* ===== Mock Data for Static Display ===== */

export const MOCK_OCR_TEXT = `The rapid advancement of artificial intelligence has transformed many industries. From healthcare to finance, AI systems are now capable of processing vast amounts of data and making predictions with remarkable accuracy. However, the ethical implications of these technologies remain a subject of intense debate. Researchers argue that we must develop robust frameworks to ensure AI systems are fair, transparent, and accountable. The bank of knowledge we have accumulated over decades of research serves as a solid foundation for future innovations.`;

export const MOCK_READER: ReadingMaterial = {
  id: "r_demo_001",
  title: "The Future of Artificial Intelligence",
  ocrText: MOCK_OCR_TEXT,
  createdAt: new Date().toISOString(),
};

export const MOCK_ARTICLE_BANK: Article = {
  title: "The Many Faces of 'Bank'",
  content: `When I walked along the winding **bank** of the river Thames last Saturday, the gentle breeze carried the scent of blooming flowers. The **bank** was lined with ancient willow trees, their branches dipping gracefully into the slow-moving water. It was a peaceful scene that made me forget, for a moment, the hustle of city life.

Later that afternoon, I needed to visit the **bank** to deposit a check. The grand marble building of the National **Bank** stood proudly in the financial district, its columns speaking to a century of trust and stability. The teller at the counter smiled as she processed my transaction efficiently.

"Your savings are growing steadily," she remarked. "You can always **bank** on our new investment plans for even better returns."

As I reflected on my day, I realized how one simple word could carry such diverse meanings. From the natural **bank** of a waterway to the financial institution where we keep our money, and even as a verb meaning to rely upon something confidently — language never ceases to amaze me with its richness and flexibility.`,
  meanings: [
    {
      meaning: "（河、湖等的）岸，堤",
      partOfSpeech: "n.",
      example:
        "When I walked along the winding **bank** of the river Thames...",
    },
    {
      meaning: "银行",
      partOfSpeech: "n.",
      example:
        "The grand marble building of the National **Bank** stood proudly...",
    },
    {
      meaning: "指望，信赖",
      partOfSpeech: "v.",
      example:
        "You can always **bank** on our new investment plans...",
    },
  ],
  difficulty: "intermediate",
  wordCount: 185,
};

export const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: "h_demo_001",
    readerId: "r_demo_001",
    word: "bank",
    articleTitle: "The Many Faces of 'Bank'",
    articleContent: MOCK_ARTICLE_BANK.content,
    meanings: MOCK_ARTICLE_BANK.meanings,
    pronunciationScore: 78,
    incorrectWords: ["winding", "breeze", "deposit"],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "h_demo_002",
    readerId: "r_demo_001",
    word: "advancement",
    articleTitle: "Advancing Through Life",
    articleContent:
      "Technological **advancement** brings both opportunities and challenges...",
    meanings: [
      {
        meaning: "进步，进展",
        partOfSpeech: "n.",
        example: "Technological **advancement** brings...",
      },
      {
        meaning: "预付款",
        partOfSpeech: "n.",
        example: "She received an **advancement** on her salary...",
      },
    ],
    pronunciationScore: 92,
    incorrectWords: ["technological"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "h_demo_003",
    readerId: "r_demo_001",
    word: "robust",
    articleTitle: "Building a Robust Mindset",
    articleContent:
      "A **robust** approach to problem-solving requires patience and persistence...",
    meanings: [
      {
        meaning: "强健的，结实的",
        partOfSpeech: "adj.",
        example: "A **robust** approach to problem-solving...",
      },
      {
        meaning: "强劲的（经济/增长）",
        partOfSpeech: "adj.",
        example: "The economy showed **robust** growth...",
      },
    ],
    pronunciationScore: 65,
    incorrectWords: ["patience", "persistence", "approach"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const MOCK_ARTICLE_SENTENCES = MOCK_ARTICLE_BANK.content
  .split(/\n\n/)
  .filter((s) => s.trim().length > 0);
