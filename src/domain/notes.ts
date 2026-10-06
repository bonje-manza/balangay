import type { Transaction } from './types';

export interface MatchChunk {
  text: string;
  isMatch: boolean;
}

/**
 * Returns deduplicated historical note suggestions matching the query,
 * sorted by recency of the transaction.
 */
export function getNoteSuggestions(
  transactions: Transaction[],
  query: string,
  limit: number = 5
): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  // Sort by date and timestamp descending so recent notes rank first
  const sorted = [...transactions].sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const suggestions: string[] = [];
  const seenLower = new Set<string>();

  for (const tx of sorted) {
    const rawNote = tx.notes?.trim();
    if (!rawNote) continue;

    const lower = rawNote.toLowerCase();
    if (lower.includes(normalizedQuery) && !seenLower.has(lower)) {
      seenLower.add(lower);
      suggestions.push(rawNote);
      if (suggestions.length >= limit) {
        break;
      }
    }
  }

  return suggestions;
}

/**
 * Splits text into matched and non-matched chunks for visual highlighting.
 */
export function splitByMatch(text: string, query: string): MatchChunk[] {
  if (!text) return [];

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [{ text, isMatch: false }];
  }

  const chunks: MatchChunk[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
    if (matchIndex === -1) {
      chunks.push({ text: text.slice(currentIndex), isMatch: false });
      break;
    }

    if (matchIndex > currentIndex) {
      chunks.push({ text: text.slice(currentIndex, matchIndex), isMatch: false });
    }

    chunks.push({
      text: text.slice(matchIndex, matchIndex + normalizedQuery.length),
      isMatch: true,
    });

    currentIndex = matchIndex + normalizedQuery.length;
  }

  return chunks;
}
