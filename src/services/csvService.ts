import { db } from '../storage/db';
import type { Account, Category, Transaction, TransactionType } from '../domain/types';
import { roundMoney } from '../domain/money';

export interface ImportCSVOptions {
  defaultAccountId: string;
  defaultCategoryId?: string;
}

export interface ImportCSVResult {
  imported: number;
  errors: string[];
}

/**
 * Escapes an individual field value conforming to RFC 4180 rules.
 * If the field contains quotes, commas, or line breaks, it is wrapped in double quotes,
 * and any existing double quotes are doubled (" -> "").
 */
function escapeCSVField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports an array of transactions to an RFC 4180-compliant CSV string.
 * Resolves account and category names for human readability.
 *
 * Header columns:
 * Date,Type,Amount (PHP),Account,Destination Account,Category,Notes,Tags,Mood
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountMap = new Map<string, string>(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));

  const headers = [
    'Date',
    'Type',
    'Amount (PHP)',
    'Account',
    'Destination Account',
    'Category',
    'Notes',
    'Tags',
    'Mood',
  ];

  const lines: string[] = [headers.join(',')];

  for (const tx of transactions) {
    const accountName = accountMap.get(tx.accountId) || tx.accountId || '';
    const destAccountName = tx.toAccountId
      ? accountMap.get(tx.toAccountId) || tx.toAccountId
      : '';
    const categoryName = tx.categoryId
      ? categoryMap.get(tx.categoryId) || tx.categoryId
      : '';
    const tagsStr = Array.isArray(tx.tags) && tx.tags.length > 0 ? tx.tags.join(', ') : '';

    const row = [
      escapeCSVField(tx.date),
      escapeCSVField(tx.type),
      escapeCSVField(tx.amount.toFixed(2)),
      escapeCSVField(accountName),
      escapeCSVField(destAccountName),
      escapeCSVField(categoryName),
      escapeCSVField(tx.notes ?? ''),
      escapeCSVField(tagsStr),
      escapeCSVField(tx.mood ?? ''),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}

/**
 * Robust RFC 4180 CSV parser.
 * Accurately handles quoted fields containing commas, escaped quotes (""), and newlines.
 *
 * @param csvContent - Raw CSV text string.
 * @returns 2D array of rows and cell values.
 */
export function parseCSV(csvContent: string): string[][] {
  if (!csvContent || !csvContent.trim()) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++; // Skip the second quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip \n
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push trailing field/row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Trim any trailing completely empty rows
  while (
    rows.length > 0 &&
    rows[rows.length - 1].length === 1 &&
    rows[rows.length - 1][0].trim() === ''
  ) {
    rows.pop();
  }

  return rows;
}

/**
 * Cleans monetary strings by stripping currency symbols, comma separators, and spaces.
 * Handles accounting negatives: (1,250.00) -> { value: 1250, isNegative: true }.
 */
function parseCurrencyString(raw: string): { value: number; isNegative: boolean } {
  if (!raw) return { value: NaN, isNegative: false };

  let trimmed = raw.trim();
  let isNegative = false;

  if (/^\((.*)\)$/.test(trimmed)) {
    isNegative = true;
    trimmed = trimmed.replace(/^\(|\)$/g, '').trim();
  } else if (trimmed.startsWith('-')) {
    isNegative = true;
    trimmed = trimmed.replace(/^-/, '').trim();
  } else if (trimmed.endsWith('-')) {
    isNegative = true;
    trimmed = trimmed.replace(/-$/, '').trim();
  }

  // Remove currency signs (₱, $, PHP), commas, and spaces
  trimmed = trimmed.replace(/[₱$]|\bPHP\b|\bphp\b|,|\s/gi, '');
  const num = parseFloat(trimmed);

  return { value: num, isNegative };
}

/**
 * Parses and imports transaction records from a CSV string into IndexedDB.
 * Supports standard exported format and common Philippine bank/GCash statement layouts.
 *
 * @param csvContent - Raw CSV text.
 * @param options - Default account ID and optional fallback category ID.
 * @returns Result object with imported transaction count and any row errors.
 */
export async function importTransactionsFromCSV(
  csvContent: string,
  options: ImportCSVOptions
): Promise<ImportCSVResult> {
  const rows = parseCSV(csvContent);
  if (rows.length <= 1) {
    return { imported: 0, errors: [] };
  }

  const headerRow = rows[0].map((h) => h.trim().toLowerCase());
  const cleanHeaders = headerRow.map((h) => h.replace(/[^a-z0-9]/g, ''));

  function findIndex(patterns: string[]): number {
    return cleanHeaders.findIndex((cleaned) =>
      patterns.some((p) => {
        const cleanPattern = p.replace(/[^a-z0-9]/g, '');
        return cleaned === cleanPattern;
      })
    );
  }

  function findPartialIndex(patterns: string[]): number {
    return cleanHeaders.findIndex((cleaned) =>
      patterns.some((p) => {
        const cleanPattern = p.replace(/[^a-z0-9]/g, '');
        return cleaned.includes(cleanPattern);
      })
    );
  }

  // Header detection
  const dateIdx =
    findIndex(['date', 'txndate', 'transactiondate', 'postingdate', 'transdate']) >= 0
      ? findIndex(['date', 'txndate', 'transactiondate', 'postingdate', 'transdate'])
      : findPartialIndex(['date']);

  const destinationAccountIdx =
    findIndex(['destinationaccount', 'toaccount', 'transferto', 'destination']) >= 0
      ? findIndex(['destinationaccount', 'toaccount', 'transferto', 'destination'])
      : findPartialIndex(['destination', 'toaccount']);

  // Match account column, ensuring it's not destination
  let accountIdx = -1;
  const exactAccIdx = findIndex(['account', 'accountname', 'sourceaccount', 'fromaccount']);
  if (exactAccIdx >= 0 && exactAccIdx !== destinationAccountIdx) {
    accountIdx = exactAccIdx;
  } else {
    const candidate = findPartialIndex(['account']);
    if (candidate >= 0 && candidate !== destinationAccountIdx) {
      accountIdx = candidate;
    }
  }

  const debitIdx = findIndex(['debit', 'withdrawal', 'debitamount']);
  const creditIdx = findIndex(['credit', 'deposit', 'creditamount']);

  const amountIdx =
    findIndex(['amountphp', 'amount', 'netamount', 'amt', 'php', 'debitcredit']) >= 0
      ? findIndex(['amountphp', 'amount', 'netamount', 'amt', 'php', 'debitcredit'])
      : findPartialIndex(['amount', 'php']);

  const typeIdx =
    findIndex(['type', 'transactiontype', 'txntype']) >= 0
      ? findIndex(['type', 'transactiontype', 'txntype'])
      : findPartialIndex(['type']);

  const categoryIdx =
    findIndex(['category', 'categoryname', 'expensecategory']) >= 0
      ? findIndex(['category', 'categoryname', 'expensecategory'])
      : findPartialIndex(['category']);

  const notesIdx =
    findIndex(['notes', 'description', 'memo', 'details', 'particulars', 'remarks']) >= 0
      ? findIndex(['notes', 'description', 'memo', 'details', 'particulars', 'remarks'])
      : findPartialIndex(['description', 'notes', 'memo', 'particulars', 'detail']);

  const tagsIdx = findIndex(['tags', 'tag']);
  const moodIdx = findIndex(['mood']);

  // Fetch accounts and categories to resolve names
  const [existingAccounts, existingCategories] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
  ]);

  const accountMapByName = new Map<string, string>();
  for (const acc of existingAccounts) {
    accountMapByName.set(acc.name.toLowerCase(), acc.id);
    accountMapByName.set(acc.id.toLowerCase(), acc.id);
  }

  const categoryMapByName = new Map<string, string>();
  for (const cat of existingCategories) {
    categoryMapByName.set(cat.name.toLowerCase(), cat.id);
    categoryMapByName.set(cat.id.toLowerCase(), cat.id);
  }

  const validTransactions: Transaction[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowNum = rowIndex + 1;

    // Skip empty lines
    if (row.every((cell) => !cell.trim())) {
      continue;
    }

    // 1. Date Validation
    const rawDate = dateIdx >= 0 ? row[dateIdx]?.trim() : '';
    if (!rawDate) {
      errors.push(`Row ${rowNum}: Missing date`);
      continue;
    }

    let parsedDate = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      parsedDate = rawDate;
    } else {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date "${rawDate}"`);
        continue;
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      parsedDate = `${year}-${month}-${day}`;
    }

    // 2. Amount & Type
    let amount = 0;
    let type: TransactionType = 'expense';

    const hasSeparateDebitCredit = debitIdx >= 0 || creditIdx >= 0;

    if (hasSeparateDebitCredit) {
      const rawDebit = debitIdx >= 0 ? row[debitIdx]?.trim() : '';
      const rawCredit = creditIdx >= 0 ? row[creditIdx]?.trim() : '';

      const debitParsed = rawDebit ? parseCurrencyString(rawDebit) : null;
      const creditParsed = rawCredit ? parseCurrencyString(rawCredit) : null;

      if (creditParsed && !isNaN(creditParsed.value) && creditParsed.value > 0) {
        amount = creditParsed.value;
        type = 'income';
      } else if (debitParsed && !isNaN(debitParsed.value) && debitParsed.value > 0) {
        amount = debitParsed.value;
        type = 'expense';
      } else {
        errors.push(`Row ${rowNum}: Invalid amount in debit/credit fields`);
        continue;
      }
    } else {
      const rawAmount = amountIdx >= 0 ? row[amountIdx]?.trim() : '';
      if (!rawAmount) {
        errors.push(`Row ${rowNum}: Missing amount`);
        continue;
      }

      const { value, isNegative } = parseCurrencyString(rawAmount);
      if (isNaN(value) || value <= 0) {
        errors.push(`Row ${rowNum}: Invalid amount "${rawAmount}"`);
        continue;
      }

      amount = value;

      const rawType = typeIdx >= 0 ? row[typeIdx]?.trim().toLowerCase() : '';
      if (rawType) {
        if (['income', 'credit', 'received', 'deposit', 'salary', 'cash in'].includes(rawType)) {
          type = 'income';
        } else if (['transfer', 'fund transfer'].includes(rawType)) {
          type = 'transfer';
        } else {
          type = 'expense';
        }
      } else {
        type = isNegative ? 'expense' : 'expense';
      }
    }

    // 3. Accounts
    const rawAccount = accountIdx >= 0 ? row[accountIdx]?.trim() : '';
    let accountId = options.defaultAccountId;
    if (rawAccount) {
      const matched = accountMapByName.get(rawAccount.toLowerCase());
      if (matched) {
        accountId = matched;
      }
    }

    const rawDest = destinationAccountIdx >= 0 ? row[destinationAccountIdx]?.trim() : '';
    let toAccountId: string | undefined = undefined;
    if (rawDest) {
      const matched = accountMapByName.get(rawDest.toLowerCase());
      toAccountId = matched || rawDest;
      if (type !== 'income') {
        type = 'transfer';
      }
    }

    // 4. Category
    const rawCategory = categoryIdx >= 0 ? row[categoryIdx]?.trim() : '';
    let categoryId = options.defaultCategoryId;
    if (rawCategory) {
      const matched = categoryMapByName.get(rawCategory.toLowerCase());
      if (matched) {
        categoryId = matched;
      }
    }

    // 5. Notes, Tags, Mood
    const notes = notesIdx >= 0 && row[notesIdx]?.trim() ? row[notesIdx].trim() : undefined;
    let tags: string[] | undefined = undefined;
    if (tagsIdx >= 0 && row[tagsIdx]?.trim()) {
      tags = row[tagsIdx]
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
    const mood = moodIdx >= 0 && row[moodIdx]?.trim() ? row[moodIdx].trim() : undefined;

    const now = new Date().toISOString();
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tx-csv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transaction: Transaction = {
      id,
      amount: roundMoney(amount),
      type,
      accountId,
      ...(toAccountId ? { toAccountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      date: parsedDate,
      ...(notes !== undefined ? { notes } : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
      ...(mood !== undefined ? { mood } : {}),
      createdAt: now,
      updatedAt: now,
    };

    validTransactions.push(transaction);
  }

  if (validTransactions.length > 0) {
    await db.transactions.bulkAdd(validTransactions);
  }

  return {
    imported: validTransactions.length,
    errors,
  };
}
