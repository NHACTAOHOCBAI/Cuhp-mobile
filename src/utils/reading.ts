/**
 * Helpers for working with reading passages on mobile.
 *
 * The backend stores `level` as a free-form string (CEFR like "A1"/"B2",
 * or whatever admin types). These helpers normalize that string into a
 * friendly label and a Badge variant so the list and detail screens can
 * render consistent UI without each one re-implementing the mapping.
 */

export type ReadingLevel = "easy" | "medium" | "hard" | "general";
export type ReadingLevelBadgeVariant = "green" | "yellow" | "pink" | "zinc";

/**
 * Map a backend level string to a UI bucket.
 * - "easy"/"a1"/"a2" -> easy
 * - "medium"/"b1"/"b2" -> medium
 * - "hard"/"c1"/"c2" -> hard
 * - everything else (null, undefined, "") -> general
 */
export function getReadingLevelBucket(level?: string | null): ReadingLevel {
  if (!level) return "general";
  const v = level.toLowerCase().trim();
  if (v === "easy" || v === "a1" || v === "a2" || v.includes("beginner")) return "easy";
  if (v === "medium" || v === "b1" || v === "b2" || v.includes("intermediate")) return "medium";
  if (v === "hard" || v === "c1" || v === "c2" || v.includes("advanced")) return "hard";
  return "general";
}

/**
 * Friendly label for the UI. When the backend has a custom string we don't
 * recognize, fall back to showing the raw string so nothing is lost.
 */
export function getReadingLevelLabel(level?: string | null): string {
  const bucket = getReadingLevelBucket(level);
  switch (bucket) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    default:
      return level && level.trim() ? level : "General";
  }
}

/**
 * Badge color variant for a level. Hard uses the new `pink` variant to match
 * the brand-critical styling on web.
 */
export function getReadingLevelVariant(
  level?: string | null
): ReadingLevelBadgeVariant {
  switch (getReadingLevelBucket(level)) {
    case "easy":
      return "green";
    case "medium":
      return "yellow";
    case "hard":
      return "pink";
    default:
      return "zinc";
  }
}

/**
 * Compute word/read-time/new-words stats for a passage's content.
 * - `words`         : whitespace-delimited tokens (>= 1 char)
 * - `minRead`       : ceil(words / 150) clamped to at least 1
 * - `newWords`      : how many lower-cased tokens are NOT in the user's vocab
 *
 * The caller is responsible for fetching the user's vocab list and passing
 * it as a Set of normalized words for O(1) lookup.
 */
export function computePassageStats(
  content: string | null | undefined,
  userVocabWords: Set<string>
): { words: number; minRead: number; newWords: number } {
  const text = (content || "").trim();
  if (!text) return { words: 0, minRead: 1, newWords: 0 };

  const tokens = text.split(/\s+/).filter(Boolean);
  let newWords = 0;
  for (const t of tokens) {
    // Strip surrounding punctuation and lowercase before checking vocab.
    const normalized = t
      .toLowerCase()
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
    if (!normalized) continue;
    if (!userVocabWords.has(normalized)) {
      newWords += 1;
    }
  }

  const words = tokens.length;
  const minRead = Math.max(1, Math.ceil(words / 150));
  return { words, minRead, newWords };
}

/**
 * Extract the sentence that contains a selected phrase from a passage.
 * Returns the sentence with the phrase highlighted by the caller (we don't
 * slice the string here — callers can split on the returned sentence).
 *
 * Mirrors `frontend/src/lib/contextSentence.ts` on web: walk paragraph
 * boundaries (blank lines) then split by sentence-end punctuation.
 */
export function extractContextSentence(
  passageContent: string,
  selection: string
): string | null {
  if (!passageContent || !selection) return null;
  const paragraphs = passageContent.split(/\n\s*\n/);
  for (const para of paragraphs) {
    if (!para.includes(selection)) continue;
    // Match on sentence boundaries. Keep the regex conservative to avoid
    // splitting on common abbreviations like "e.g." or "Mr.".
    const sentences = para.match(/[^.!?\n]+(?:[.!?]+|$)/g);
    if (!sentences) continue;
    for (const raw of sentences) {
      const sentence = raw.trim();
      if (sentence.includes(selection)) return sentence;
    }
    // Fallback: return the whole paragraph if no sentence boundary matched.
    return para.trim();
  }
  return null;
}
