import { describe, it, expect } from 'vitest';
import type { Transaction } from './types';
import { getNoteSuggestions, splitByMatch } from './notes';

describe('getNoteSuggestions', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 450,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-01',
      notes: 'Ramen Nagi with team',
      createdAt: '2026-10-01T12:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'tx-2',
      amount: 120,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-02',
      notes: 'Grab car to office',
      createdAt: '2026-10-02T08:00:00Z',
      updatedAt: '2026-10-02T08:00:00Z',
    },
    {
      id: 'tx-3',
      amount: 550,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-03',
      notes: 'Ramen Nagi dinner',
      createdAt: '2026-10-03T19:00:00Z',
      updatedAt: '2026-10-03T19:00:00Z',
    },
    {
      id: 'tx-4',
      amount: 600,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-04',
      notes: 'ramen nagi with team', // Duplicate with different casing, more recent
      createdAt: '2026-10-04T13:00:00Z',
      updatedAt: '2026-10-04T13:00:00Z',
    },
    {
      id: 'tx-5',
      amount: 80,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-05',
      notes: 'Iced caramel macchiato',
      createdAt: '2026-10-05T09:00:00Z',
      updatedAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'tx-6',
      amount: 200,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-10-05',
      notes: undefined,
      createdAt: '2026-10-05T10:00:00Z',
      updatedAt: '2026-10-05T10:00:00Z',
    },
  ];

  it('returns empty array when query is empty or whitespace only', () => {
    expect(getNoteSuggestions(sampleTransactions, '')).toEqual([]);
    expect(getNoteSuggestions(sampleTransactions, '   ')).toEqual([]);
  });

  it('returns matching notes case-insensitively and sorted by recency', () => {
    const results = getNoteSuggestions(sampleTransactions, 'ramen');
    // tx-4 is from 2026-10-04, tx-3 is from 2026-10-03
    expect(results).toEqual([
      'ramen nagi with team',
      'Ramen Nagi dinner',
    ]);
  });

  it('matches substrings anywhere in the note string', () => {
    const results = getNoteSuggestions(sampleTransactions, 'team');
    expect(results).toEqual(['ramen nagi with team']);
  });

  it('deduplicates case-insensitively while preserving the most recent string', () => {
    const results = getNoteSuggestions(sampleTransactions, 'nagi');
    // tx-4 was 2026-10-04 ("ramen nagi with team")
    // tx-1 was 2026-10-01 ("Ramen Nagi with team")
    // Should contain "ramen nagi with team" once, not both
    expect(results).toContain('ramen nagi with team');
    expect(results.filter((r) => r.toLowerCase() === 'ramen nagi with team').length).toBe(1);
  });

  it('respects the limit argument', () => {
    const extraTransactions: Transaction[] = [
      ...sampleTransactions,
      {
        id: 'tx-7',
        amount: 300,
        type: 'expense',
        accountId: 'acc-1',
        date: '2026-10-06',
        notes: 'Ramen Kuroda lunch',
        createdAt: '2026-10-06T12:00:00Z',
        updatedAt: '2026-10-06T12:00:00Z',
      },
    ];

    const results = getNoteSuggestions(extraTransactions, 'ramen', 2);
    expect(results).toHaveLength(2);
    expect(results[0]).toBe('Ramen Kuroda lunch');
  });

  it('handles empty transaction list gracefully', () => {
    expect(getNoteSuggestions([], 'test')).toEqual([]);
  });
});

describe('splitByMatch', () => {
  it('returns single non-match chunk when query is empty', () => {
    expect(splitByMatch('Ramen Nagi', '')).toEqual([
      { text: 'Ramen Nagi', isMatch: false },
    ]);
  });

  it('returns single non-match chunk when no match is found', () => {
    expect(splitByMatch('Ramen Nagi', 'sushi')).toEqual([
      { text: 'Ramen Nagi', isMatch: false },
    ]);
  });

  it('splits single match correctly preserving casing', () => {
    expect(splitByMatch('Ramen Nagi with team', 'nagi')).toEqual([
      { text: 'Ramen ', isMatch: false },
      { text: 'Nagi', isMatch: true },
      { text: ' with team', isMatch: false },
    ]);
  });

  it('handles match at the very beginning of the string', () => {
    expect(splitByMatch('Ramen Nagi', 'ram')).toEqual([
      { text: 'Ram', isMatch: true },
      { text: 'en Nagi', isMatch: false },
    ]);
  });

  it('handles match at the very end of the string', () => {
    expect(splitByMatch('Ramen Nagi', 'nagi')).toEqual([
      { text: 'Ramen ', isMatch: false },
      { text: 'Nagi', isMatch: true },
    ]);
  });

  it('handles multiple matches in a string', () => {
    expect(splitByMatch('Cha-cha-cha', 'cha')).toEqual([
      { text: 'Cha', isMatch: true },
      { text: '-', isMatch: false },
      { text: 'cha', isMatch: true },
      { text: '-', isMatch: false },
      { text: 'cha', isMatch: true },
    ]);
  });
});
