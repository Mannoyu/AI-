import type { FeedbackToken } from "@/types";

/**
 * Clean a word: lowercase, strip punctuation, keep only letters/apostrophes/hyphens.
 */
function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z'-]/g, "");
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row DP for memory efficiency
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    // Swap arrays
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

/**
 * Align two word sequences using a greedy edit-distance approach.
 *
 * Returns a FeedbackToken for each word in the ORIGINAL sentence,
 * comparing against the ASR (spoken) transcript.
 *
 * Alignment rules:
 * - Exact match (case-insensitive, ignoring trailing punctuation) → correct
 * - Within Levenshtein distance ≤ 1 (minor mispronunciation) → correct
 * - No matching ASR word within reasonable window → incorrect
 * - Target word match → target (gold highlight, overrides correct)
 * - Extra ASR words are ignored (user said more than required)
 */
export function alignWords(
  originalWords: string[],
  spokenWords: string[],
  targetWord: string
): FeedbackToken[] {
  const tokens: FeedbackToken[] = [];
  const targetClean = cleanWord(targetWord);

  // Track which spoken words have been matched
  const usedSpoken = new Array<boolean>(spokenWords.length).fill(false);

  for (let i = 0; i < originalWords.length; i++) {
    const origClean = cleanWord(originalWords[i]);

    // Skip empty tokens (punctuation-only)
    if (!origClean) {
      tokens.push({
        word: originalWords[i],
        status: "pending",
        originalIndex: i,
      });
      continue;
    }

    const isTarget = origClean === targetClean;

    // Search for a match in the spoken words, preferring nearby positions
    const searchWindow = Math.max(
      0,
      Math.min(i - 2, spokenWords.length - 1)
    );
    const searchEnd = Math.min(i + 3, spokenWords.length);

    let bestMatchIndex = -1;
    let bestDistance = Infinity;

    for (let j = searchWindow; j < searchEnd; j++) {
      if (usedSpoken[j]) continue;
      const spokenClean = cleanWord(spokenWords[j]);
      if (!spokenClean) continue;

      // Exact match
      if (origClean === spokenClean) {
        bestMatchIndex = j;
        bestDistance = 0;
        break;
      }

      // Fuzzy match (Levenshtein ≤ 1)
      const dist = levenshtein(origClean, spokenClean);
      if (dist <= 1 && dist < bestDistance) {
        bestMatchIndex = j;
        bestDistance = dist;
      }
    }

    let status: FeedbackToken["status"];

    if (bestMatchIndex >= 0) {
      usedSpoken[bestMatchIndex] = true;
      status = isTarget ? "target" : "correct";
    } else {
      status = "incorrect";
      // A target word that was missed still gets special treatment
      if (isTarget) {
        status = "incorrect";
      }
    }

    tokens.push({
      word: originalWords[i],
      status: isTarget ? "target" : status,
      originalIndex: i,
    });
  }

  return tokens;
}

/**
 * Calculate a pronunciation score from feedback tokens.
 * Score = (correct + target tokens) / total meaningful tokens × 100
 */
export function calculateScore(tokens: FeedbackToken[]): number {
  const scorable = tokens.filter((t) => t.status !== "pending");
  if (scorable.length === 0) return 0;

  const good = scorable.filter(
    (t) => t.status === "correct" || t.status === "target"
  ).length;

  return Math.round((good / scorable.length) * 100);
}

/**
 * Extract words from a sentence string.
 */
export function extractWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter((w) => w.length > 0);
}
