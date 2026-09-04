/**
 * Vocabulary-related constants and label helpers, shared between
 * VocabularyScreen (filter UI) and ReviewScreen (flashcard back-of-card).
 */

export const WORD_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'pronoun', label: 'Pronoun' },
  { value: 'preposition', label: 'Preposition' },
  { value: 'conjunction', label: 'Conjunction' },
  { value: 'interjection', label: 'Interjection' },
  { value: 'other', label: 'Other' },
] as const;

export type WordTypeValue = (typeof WORD_TYPES)[number]['value'];

/**
 * Map a raw `word_type` string (case-insensitive, may be missing or unknown)
 * to its English display label. Unknown values fall through to `'Other'`.
 */
export function getWordTypeLabel(type?: string | null): string {
  const normalized = type?.toLowerCase() || '';
  switch (normalized) {
    case 'noun':
      return 'Noun';
    case 'verb':
      return 'Verb';
    case 'adjective':
      return 'Adjective';
    case 'adverb':
      return 'Adverb';
    case 'pronoun':
      return 'Pronoun';
    case 'preposition':
      return 'Preposition';
    case 'conjunction':
      return 'Conjunction';
    case 'interjection':
      return 'Interjection';
    default:
      return 'Other';
  }
}
