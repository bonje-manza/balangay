import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetDatabase } from '../storage/db';
import {
  exportTransactionsToCSV,
  parseCSV,
  importTransactionsFromCSV,
} from './csvService';
import type { Account, Category, Transaction } from '../domain/types';

describe('csvService: CSV Export, Parsing & Import', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const sampleAccounts: Account[] = [
    {
      id: 'acc-gcash',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 5000,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'Smartphone',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-bpi',
      name: 'BPI Savings',
      type: 'bank',
      initialBalance: 15000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Landmark',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const sampleCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 8000,
    },
    {
      id: 'cat-salary',
      name: 'Salary & Wages',
      type: 'income',
      icon: 'Briefcase',
      color: '#DAE097',
    },
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 450.5,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-food',
      date: '2026-09-10',
      notes: 'Lunch at Jollibee, with drinks',
      tags: ['food', 'lunch'],
      mood: 'Treat',
      createdAt: '2026-09-10T12:00:00.000Z',
      updatedAt: '2026-09-10T12:00:00.000Z',
    },
    {
      id: 'tx-2',
      amount: 25000,
      type: 'income',
      accountId: 'acc-bpi',
      categoryId: 'cat-salary',
      date: '2026-09-01',
      notes: 'September 1st cutoff salary',
      tags: ['work', 'payroll'],
      mood: 'Peaceful',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'tx-3',
      amount: 2000,
      type: 'transfer',
      accountId: 'acc-bpi',
      toAccountId: 'acc-gcash',
      date: '2026-09-05',
      notes: 'Transfer for "daily allowance"\nLine 2',
      tags: ['transfer'],
      mood: 'Essential',
      createdAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:00:00.000Z',
    },
  ];

  describe('parseCSV (RFC 4180 Parser)', () => {
    it('parses standard unquoted CSV content', () => {
      const csv = 'Date,Type,Amount\n2026-09-10,expense,450.50\n2026-09-11,income,1000';
      const result = parseCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(['Date', 'Type', 'Amount']);
      expect(result[1]).toEqual(['2026-09-10', 'expense', '450.50']);
      expect(result[2]).toEqual(['2026-09-11', 'income', '1000']);
    });

    it('correctly handles quoted fields containing commas', () => {
      const csv = 'Name,Description,Amount\nLunch,"Jollibee, Chickenjoy and Spaghetti",250.00';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(['Lunch', 'Jollibee, Chickenjoy and Spaghetti', '250.00']);
    });

    it('correctly handles escaped double quotes inside quoted fields', () => {
      const csv = 'Header\n"He said ""Hello, World!"""\n"Item with ""quote"""';
      const result = parseCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[1]).toEqual(['He said "Hello, World!"']);
      expect(result[2]).toEqual(['Item with "quote"']);
    });

    it('correctly handles newlines within quoted fields', () => {
      const csv = 'Header1,Header2\n"Line 1\nLine 2\r\nLine 3",Value2';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[1][0]).toBe('Line 1\nLine 2\r\nLine 3');
      expect(result[1][1]).toBe('Value2');
    });

    it('handles CRLF and LF line breaks uniformly', () => {
      const csv = 'A,B\r\n1,2\n3,4\r\n';
      const result = parseCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(['A', 'B']);
      expect(result[1]).toEqual(['1', '2']);
      expect(result[2]).toEqual(['3', '4']);
    });

    it('returns empty array for empty string or whitespace only', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('   \n\r\n  ')).toEqual([]);
    });
  });

  describe('exportTransactionsToCSV', () => {
    it('generates RFC 4180 CSV with correct headers and human-readable names', () => {
      const csv = exportTransactionsToCSV(sampleTransactions, sampleAccounts, sampleCategories);
      const rows = parseCSV(csv);

      expect(rows[0]).toEqual([
        'Date',
        'Type',
        'Amount (PHP)',
        'Account',
        'Destination Account',
        'Category',
        'Notes',
        'Tags',
        'Mood',
      ]);

      // Row 1: expense
      expect(rows[1][0]).toBe('2026-09-10');
      expect(rows[1][1]).toBe('expense');
      expect(rows[1][2]).toBe('450.50');
      expect(rows[1][3]).toBe('GCash'); // Account name resolved
      expect(rows[1][4]).toBe(''); // No destination
      expect(rows[1][5]).toBe('Food & Dining'); // Category name resolved
      expect(rows[1][6]).toBe('Lunch at Jollibee, with drinks');
      expect(rows[1][7]).toBe('food, lunch');
      expect(rows[1][8]).toBe('Treat');

      // Row 2: income
      expect(rows[2][0]).toBe('2026-09-01');
      expect(rows[2][1]).toBe('income');
      expect(rows[2][2]).toBe('25000.00');
      expect(rows[2][3]).toBe('BPI Savings');
      expect(rows[2][5]).toBe('Salary & Wages');

      // Row 3: transfer
      expect(rows[3][0]).toBe('2026-09-05');
      expect(rows[3][1]).toBe('transfer');
      expect(rows[3][2]).toBe('2000.00');
      expect(rows[3][3]).toBe('BPI Savings');
      expect(rows[3][4]).toBe('GCash'); // Destination resolved
      expect(rows[3][6]).toBe('Transfer for "daily allowance"\nLine 2');
    });

    it('escapes quotes, commas, and line breaks properly in exported CSV', () => {
      const trickyTx: Transaction = {
        id: 'tx-tricky',
        amount: 99.99,
        type: 'expense',
        accountId: 'acc-gcash',
        date: '2026-09-12',
        notes: 'Quote: "Special", with comma and\nnewline',
        tags: ['tag "1"', 'tag, 2'],
        mood: 'Treat, peaceful',
        createdAt: '2026-09-12T00:00:00.000Z',
        updatedAt: '2026-09-12T00:00:00.000Z',
      };

      const csv = exportTransactionsToCSV([trickyTx], sampleAccounts, sampleCategories);
      const parsed = parseCSV(csv);

      expect(parsed[1][6]).toBe('Quote: "Special", with comma and\nnewline');
      expect(parsed[1][7]).toBe('tag "1", tag, 2');
      expect(parsed[1][8]).toBe('Treat, peaceful');
    });

    it('exports empty string when transaction array is empty, but includes header', () => {
      const csv = exportTransactionsToCSV([], sampleAccounts, sampleCategories);
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0][0]).toBe('Date');
    });
  });

  describe('importTransactionsFromCSV', () => {
    beforeEach(async () => {
      for (const acc of sampleAccounts) {
        await db.accounts.add(acc);
      }
      for (const cat of sampleCategories) {
        await db.categories.add(cat);
      }
    });

    it('imports standard exported CSV and saves transactions into IndexedDB', async () => {
      const csv = exportTransactionsToCSV(sampleTransactions, sampleAccounts, sampleCategories);

      const result = await importTransactionsFromCSV(csv, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(3);
      expect(result.errors).toEqual([]);

      const storedTxs = await db.transactions.toArray();
      expect(storedTxs).toHaveLength(3);

      const expenseTx = storedTxs.find((t) => t.type === 'expense');
      expect(expenseTx).toBeDefined();
      expect(expenseTx?.amount).toBe(450.5);
      expect(expenseTx?.accountId).toBe('acc-gcash');
      expect(expenseTx?.categoryId).toBe('cat-food');
      expect(expenseTx?.notes).toBe('Lunch at Jollibee, with drinks');
      expect(expenseTx?.mood).toBe('Treat');

      const transferTx = storedTxs.find((t) => t.type === 'transfer');
      expect(transferTx).toBeDefined();
      expect(transferTx?.amount).toBe(2000);
      expect(transferTx?.accountId).toBe('acc-bpi');
      expect(transferTx?.toAccountId).toBe('acc-gcash');
    });

    it('cleans Philippine Peso currency symbols (₱, PHP, commas) from amounts', async () => {
      const statementCSV = `Date,Type,Amount,Category,Account,Notes
2026-09-02,expense,"₱ 1,450.75",Food & Dining,GCash,Grocery run
2026-09-03,income,"PHP 12,000.00",Salary & Wages,BPI Savings,Side project`;

      const result = await importTransactionsFromCSV(statementCSV, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(2);
      expect(result.errors).toEqual([]);

      const txs = await db.transactions.toArray();
      expect(txs.find((t) => t.date === '2026-09-02')?.amount).toBe(1450.75);
      expect(txs.find((t) => t.date === '2026-09-03')?.amount).toBe(12000);
    });

    it('handles flexible headers (Txn Date, Description, Amount PHP, etc.)', async () => {
      const flexibleCSV = `Txn Date,Particulars,Amount PHP,Category Name
2026-09-04,Coffee with friends,180.00,Food & Dining`;

      const result = await importTransactionsFromCSV(flexibleCSV, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(1);
      const tx = (await db.transactions.toArray())[0];
      expect(tx.date).toBe('2026-09-04');
      expect(tx.notes).toBe('Coffee with friends');
      expect(tx.amount).toBe(180);
      expect(tx.categoryId).toBe('cat-food');
      expect(tx.accountId).toBe('acc-gcash'); // Fallback to default
    });

    it('handles separate Debit and Credit columns common in Philippine bank statements', async () => {
      const bankCSV = `Date,Description,Debit,Credit
2026-09-05,ATM Withdrawal,1000.00,
2026-09-06,Payroll Deposit,,35000.00`;

      const result = await importTransactionsFromCSV(bankCSV, {
        defaultAccountId: 'acc-bpi',
      });

      expect(result.imported).toBe(2);
      const txs = await db.transactions.toArray();

      const debitTx = txs.find((t) => t.notes === 'ATM Withdrawal');
      expect(debitTx?.type).toBe('expense');
      expect(debitTx?.amount).toBe(1000);
      expect(debitTx?.accountId).toBe('acc-bpi');

      const creditTx = txs.find((t) => t.notes === 'Payroll Deposit');
      expect(creditTx?.type).toBe('income');
      expect(creditTx?.amount).toBe(35000);
      expect(creditTx?.accountId).toBe('acc-bpi');
    });

    it('handles negative amount syntax e.g. -500 or accounting format (500.00)', async () => {
      const csv = `Date,Description,Amount
2026-09-07,Negative expense,-250.00
2026-09-08,Accounting style expense,(750.50)`;

      const result = await importTransactionsFromCSV(csv, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(2);
      const txs = await db.transactions.toArray();
      const tx1 = txs.find((t) => t.date === '2026-09-07');
      const tx2 = txs.find((t) => t.date === '2026-09-08');
      expect(tx1?.amount).toBe(250);
      expect(tx1?.type).toBe('expense');
      expect(tx2?.amount).toBe(750.5);
      expect(tx2?.type).toBe('expense');
    });

    it('falls back to defaultAccountId and defaultCategoryId when unmatched', async () => {
      const csv = `Date,Type,Amount,Account,Category
2026-09-09,expense,300,NonExistentAccount,NonExistentCategory`;

      const result = await importTransactionsFromCSV(csv, {
        defaultAccountId: 'acc-gcash',
        defaultCategoryId: 'cat-food',
      });

      expect(result.imported).toBe(1);
      const tx = (await db.transactions.toArray())[0];
      expect(tx.accountId).toBe('acc-gcash');
      expect(tx.categoryId).toBe('cat-food');
    });

    it('gracefully reports invalid rows without crashing or dropping valid rows', async () => {
      const csvWithErrors = `Date,Type,Amount
2026-09-10,expense,150.00
not-a-date,expense,200.00
2026-09-11,expense,invalid-amount
2026-09-12,expense,0
2026-09-13,expense,350.00`;

      const result = await importTransactionsFromCSV(csvWithErrors, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(2); // rows 1 and 5
      expect(result.errors.length).toBe(3);
      expect(result.errors[0]).toMatch(/invalid date/i);
      expect(result.errors[1]).toMatch(/invalid amount/i);
      expect(result.errors[2]).toMatch(/invalid amount/i);
    });

    it('returns 0 imported and empty errors for empty or whitespace CSV', async () => {
      const result = await importTransactionsFromCSV('', {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('successfully imports GCash style statement lines', async () => {
      const gcashCSV = `Date,Description,Amount,Type
2026-09-08,Express Send to 09171234567,₱ 500.00,expense
2026-09-09,Cash In via BPI Online,"₱ 3,000.00",income
2026-09-10,Pay QR to Merchant,-125.50,expense`;

      const result = await importTransactionsFromCSV(gcashCSV, {
        defaultAccountId: 'acc-gcash',
      });

      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);

      const txs = await db.transactions.toArray();
      const sendTx = txs.find((t) => t.notes?.includes('Express Send'));
      expect(sendTx?.amount).toBe(500);
      expect(sendTx?.type).toBe('expense');

      const cashInTx = txs.find((t) => t.notes?.includes('Cash In'));
      expect(cashInTx?.amount).toBe(3000);
      expect(cashInTx?.type).toBe('income');

      const qrTx = txs.find((t) => t.notes?.includes('Pay QR'));
      expect(qrTx?.amount).toBe(125.5);
      expect(qrTx?.type).toBe('expense');
    });

    it('performs full roundtrip export and re-import with preserved values', async () => {
      // Export sample transactions
      const exportedCsv = exportTransactionsToCSV(sampleTransactions, sampleAccounts, sampleCategories);

      // Reset transactions table
      await db.transactions.clear();
      expect(await db.transactions.count()).toBe(0);

      // Re-import
      const importResult = await importTransactionsFromCSV(exportedCsv, {
        defaultAccountId: 'acc-gcash',
      });

      expect(importResult.imported).toBe(3);
      expect(importResult.errors).toEqual([]);

      const importedTxs = await db.transactions.toArray();
      expect(importedTxs).toHaveLength(3);

      const t1 = importedTxs.find((t) => t.date === '2026-09-10');
      expect(t1?.amount).toBe(450.5);
      expect(t1?.accountId).toBe('acc-gcash');
      expect(t1?.categoryId).toBe('cat-food');
      expect(t1?.tags).toEqual(['food', 'lunch']);
      expect(t1?.mood).toBe('Treat');

      const t3 = importedTxs.find((t) => t.date === '2026-09-05');
      expect(t3?.amount).toBe(2000);
      expect(t3?.type).toBe('transfer');
      expect(t3?.accountId).toBe('acc-bpi');
      expect(t3?.toAccountId).toBe('acc-gcash');
    });
  });
});
