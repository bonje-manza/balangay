import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetDatabase, FinanceTrackerDB } from './db';
import {
  DEFAULT_CATEGORIES,
  PHILIPPINE_STARTER_ACCOUNTS,
  seedDefaultCategories,
  seedStarterAccounts,
  loadSampleDemoData,
} from './seedData';

describe('FinanceTrackerDB & Seed Data', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Database Initialization & Schema', () => {
    it('initializes FinanceTrackerDB with correct tables and schema version', () => {
      expect(db).toBeInstanceOf(FinanceTrackerDB);
      expect(db.name).toBe('FinanceTrackerDB');
      expect(db.verno).toBe(1);

      // Verify all 4 tables exist
      expect(db.accounts).toBeDefined();
      expect(db.transactions).toBeDefined();
      expect(db.categories).toBeDefined();
      expect(db.settings).toBeDefined();
    });

    it('defines correct schema indexes for all tables', () => {
      const accountsTable = db.table('accounts');
      expect(accountsTable.schema.primKey.name).toBe('id');
      const accountIndexNames = accountsTable.schema.indexes.map((idx) => idx.name);
      expect(accountIndexNames).toContain('name');
      expect(accountIndexNames).toContain('type');
      expect(accountIndexNames).toContain('isArchived');
      expect(accountIndexNames).toContain('createdAt');

      const transactionsTable = db.table('transactions');
      expect(transactionsTable.schema.primKey.name).toBe('id');
      const txIndexNames = transactionsTable.schema.indexes.map((idx) => idx.name);
      expect(txIndexNames).toContain('accountId');
      expect(txIndexNames).toContain('toAccountId');
      expect(txIndexNames).toContain('categoryId');
      expect(txIndexNames).toContain('type');
      expect(txIndexNames).toContain('date');
      expect(txIndexNames).toContain('createdAt');

      const categoriesTable = db.table('categories');
      expect(categoriesTable.schema.primKey.name).toBe('id');
      const catIndexNames = categoriesTable.schema.indexes.map((idx) => idx.name);
      expect(catIndexNames).toContain('name');
      expect(catIndexNames).toContain('type');

      const settingsTable = db.table('settings');
      expect(settingsTable.schema.primKey.name).toBe('key');
    });

    it('resets database cleanly wiping all records', async () => {
      await db.accounts.add({
        id: 'acc-test',
        name: 'Test Account',
        type: 'cash',
        initialBalance: 100,
        currency: 'PHP',
        color: '#FFED9E',
        icon: 'Wallet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(await db.accounts.count()).toBe(1);
      await resetDatabase();
      expect(await db.accounts.count()).toBe(0);
    });
  });

  describe('Default Categories Seed', () => {
    it('contains valid Philippine localized default categories with soft neo-brutalist colors', () => {
      expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(12);

      const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.type === 'expense');
      const incomeCategories = DEFAULT_CATEGORIES.filter((c) => c.type === 'income');

      expect(expenseCategories.length).toBe(8);
      expect(incomeCategories.length).toBe(4);

      // Verify specific required categories exist
      const names = DEFAULT_CATEGORIES.map((c) => c.name);
      expect(names).toContain('Food & Dining');
      expect(names).toContain('Groceries & Market');
      expect(names).toContain('Transpo, Gas & Commute');
      expect(names).toContain('Utilities & Bills (Electricity/Water/Internet)');
      expect(names).toContain('Shopping & Treats');
      expect(names).toContain('Health & Wellness');
      expect(names).toContain('Housing & Rent');
      expect(names).toContain('GCash / Bank Fees');
      expect(names).toContain('Salary & Wages');
      expect(names).toContain('Freelance & Side Gigs');
      expect(names).toContain('Allowances & Gifts');
      expect(names).toContain('Investments & Dividends');

      // Verify budget limits are assigned to expense categories
      const food = DEFAULT_CATEGORIES.find((c) => c.name === 'Food & Dining');
      expect(food?.budgetLimit).toBe(8000);
      expect(food?.color).toBe('#FFED9E');

      const groceries = DEFAULT_CATEGORIES.find((c) => c.name === 'Groceries & Market');
      expect(groceries?.budgetLimit).toBe(10000);
      expect(groceries?.color).toBe('#DAE097');

      const rent = DEFAULT_CATEGORIES.find((c) => c.name === 'Housing & Rent');
      expect(rent?.budgetLimit).toBe(12000);

      // Palette validation
      const validPalette = ['#FFED9E', '#F2C0CA', '#DAE097', '#A6CFF2', '#111111'];
      DEFAULT_CATEGORIES.forEach((cat) => {
        expect(validPalette).toContain(cat.color.toUpperCase());
        expect(cat.icon).toBeTruthy();
      });
    });

    it('seeds default categories if table is empty', async () => {
      expect(await db.categories.count()).toBe(0);
      await seedDefaultCategories();
      expect(await db.categories.count()).toBe(DEFAULT_CATEGORIES.length);
    });

    it('is idempotent and does not duplicate categories if called repeatedly', async () => {
      await seedDefaultCategories();
      const initialCount = await db.categories.count();
      await seedDefaultCategories();
      const secondCount = await db.categories.count();
      expect(secondCount).toBe(initialCount);
    });
  });

  describe('Philippine Starter Accounts Seed', () => {
    it('defines the 6 starter accounts with realistic initial balances', () => {
      expect(PHILIPPINE_STARTER_ACCOUNTS).toHaveLength(6);
      const names = PHILIPPINE_STARTER_ACCOUNTS.map((a) => a.name);
      expect(names).toContain('GCash');
      expect(names).toContain('Maya');
      expect(names).toContain('BPI Savings');
      expect(names).toContain('BDO Checking / Savings');
      expect(names).toContain('Cash Wallet');
      expect(names).toContain('Credit Card');

      const gcash = PHILIPPINE_STARTER_ACCOUNTS.find((a) => a.name === 'GCash');
      expect(gcash?.type).toBe('ewallet');
      expect(gcash?.initialBalance).toBe(2500);
      expect(gcash?.color).toBe('#A6CFF2');

      const bpi = PHILIPPINE_STARTER_ACCOUNTS.find((a) => a.name === 'BPI Savings');
      expect(bpi?.type).toBe('bank');
      expect(bpi?.initialBalance).toBe(15000);
      expect(bpi?.color).toBe('#F2C0CA');
    });

    it('seeds all starter accounts when no filter is provided', async () => {
      expect(await db.accounts.count()).toBe(0);
      await seedStarterAccounts();
      expect(await db.accounts.count()).toBe(6);

      const accounts = await db.accounts.toArray();
      const gcash = accounts.find((a) => a.name === 'GCash');
      expect(gcash).toBeDefined();
      expect(gcash?.initialBalance).toBe(2500);
      expect(gcash?.currency).toBe('PHP');
      expect(gcash?.createdAt).toBeDefined();
      expect(gcash?.updatedAt).toBeDefined();
    });

    it('seeds only selected account templates when specified', async () => {
      await seedStarterAccounts(['GCash', 'Maya']);
      expect(await db.accounts.count()).toBe(2);
      const accounts = await db.accounts.toArray();
      const names = accounts.map((a) => a.name);
      expect(names).toEqual(expect.arrayContaining(['GCash', 'Maya']));
      expect(names).not.toContain('BPI Savings');
    });

    it('is idempotent and does not overwrite existing accounts', async () => {
      await seedStarterAccounts(['GCash']);
      expect(await db.accounts.count()).toBe(1);
      await seedStarterAccounts();
      // Should now have 6 total without duplicate GCash
      expect(await db.accounts.count()).toBe(6);
    });
  });

  describe('Sample Demo Data', () => {
    it('populates accounts, categories, and 15-20 realistic transactions over 30 days', async () => {
      await loadSampleDemoData();

      const accountCount = await db.accounts.count();
      const categoryCount = await db.categories.count();
      const txCount = await db.transactions.count();

      expect(accountCount).toBeGreaterThanOrEqual(5);
      expect(categoryCount).toBeGreaterThanOrEqual(12);
      expect(txCount).toBeGreaterThanOrEqual(15);
      expect(txCount).toBeLessThanOrEqual(20);

      const transactions = await db.transactions.toArray();

      // Check transaction types include income, expense, and transfer
      const types = new Set(transactions.map((t) => t.type));
      expect(types.has('income')).toBe(true);
      expect(types.has('expense')).toBe(true);
      expect(types.has('transfer')).toBe(true);

      // Check transfers have both accountId and toAccountId
      const transfers = transactions.filter((t) => t.type === 'transfer');
      expect(transfers.length).toBeGreaterThan(0);
      transfers.forEach((t) => {
        expect(t.accountId).toBeTruthy();
        expect(t.toAccountId).toBeTruthy();
        expect(t.accountId).not.toBe(t.toAccountId);
      });

      // Check mood tags are present
      const moods = transactions.map((t) => t.mood).filter(Boolean);
      expect(moods).toContain('Peaceful');
      expect(moods).toContain('Essential');
      expect(moods).toContain('Treat');

      // Check date range within past 30 days
      const now = Date.now();
      const thirtyDaysAgo = now - 32 * 24 * 60 * 60 * 1000;
      transactions.forEach((t) => {
        const txTime = new Date(t.date).getTime();
        expect(txTime).toBeGreaterThanOrEqual(thirtyDaysAgo);
        expect(txTime).toBeLessThanOrEqual(now + 24 * 60 * 60 * 1000);
      });
    });
  });
});
