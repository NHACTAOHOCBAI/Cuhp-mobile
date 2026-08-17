/**
 * Vocabulary-related constants and label helpers, shared between
 * VocabularyScreen (filter UI) and ReviewScreen (flashcard back-of-card).
 */

export const WORD_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'noun', label: 'Danh từ' },
  { value: 'verb', label: 'Động từ' },
  { value: 'adjective', label: 'Tính từ' },
  { value: 'adverb', label: 'Trạng từ' },
  { value: 'pronoun', label: 'Đại từ' },
  { value: 'preposition', label: 'Giới từ' },
  { value: 'conjunction', label: 'Liên từ' },
  { value: 'interjection', label: 'Thán từ' },
  { value: 'other', label: 'Khác' },
] as const;

export type WordTypeValue = (typeof WORD_TYPES)[number]['value'];

/**
 * Map a raw `word_type` string (case-insensitive, may be missing or unknown)
 * to its Vietnamese display label. Unknown values fall through to `'Khác'`.
 */
export function getWordTypeLabel(type?: string | null): string {
  const normalized = type?.toLowerCase() || '';
  switch (normalized) {
    case 'noun':
      return 'Danh từ';
    case 'verb':
      return 'Động từ';
    case 'adjective':
      return 'Tính từ';
    case 'adverb':
      return 'Trạng từ';
    case 'pronoun':
      return 'Đại từ';
    case 'preposition':
      return 'Giới từ';
    case 'conjunction':
      return 'Liên từ';
    case 'interjection':
      return 'Thán từ';
    default:
      return 'Khác';
  }
}
