import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from './db';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} from './accountRepository';
import {
  getTransactions,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
} from './transactionRepository';
import { getUserSettings, saveUserSettings } from './settingsRepository';

describe('Repositories Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Account Repository', () => {
    it('creates, retrieves, and lists accounts', async () => {
      const created = await createAccount({
        name: 'GCash',
        type: 'ewallet',
        initialBalance: 5000,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'Smartphone',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('GCash');
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      const fetched = await getAccountById(created.id);
      expect(fetched).toEqual(created);

      const all = await getAccounts();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('GCash');
    });

    it('updates an account name and balance', async () => {
      const created = await createAccount({
        name: 'Maya Wallet',
        type: 'ewallet',
        initialBalance: 1000,
        currency: 'PHP',
        color: '#DAE097',
        icon: 'Smartphone',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateAccount(created.id, {
        name: 'Maya Pro',
        initialBalance: 2500,
      });

      const updated = await getAccountById(created.id);
      expect(updated?.name).toBe('Maya Pro');
      expect(updated?.initialBalance).toBe(2500);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime()
      );
    });

    it('deletes an account and cascades cleanup of associated transactions', async () => {
      const acc1 = await createAccount({
        name: 'Source Account',
        type: 'bank',
        initialBalance: 10000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'Building2',
      });

      const acc2 = await createAccount({
        name: 'Dest Account',
        type: 'ewallet',
        initialBalance: 2000,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'Smartphone',
      });

      // Transaction directly on acc1
      await createTransaction({
        amount: 500,
        type: 'expense',
        accountId: acc1.id,
        categoryId: 'cat-groceries',
        date: '2026-09-01',
      });

      // Transfer from acc1 to acc2
      await createTransfer({
        fromAccountId: acc1.id,
        toAccountId: acc2.id,
        amount: 1500,
        date: '2026-09-02',
      });

      // Independent transaction on acc2
      await createTransaction({
        amount: 300,
        type: 'expense',
        accountId: acc2.id,
        categoryId: 'cat-food-dining',
        date: '2026-09-03',
      });

      expect(await getTransactions()).toHaveLength(3);

      // Deleting acc1 should delete acc1 and its 2 associated transactions
      await deleteAccount(acc1.id);

      expect(await getAccountById(acc1.id)).toBeUndefined();
      const remainingTx = await getTransactions();
      expect(remainingTx).toHaveLength(1);
      expect(remainingTx[0].accountId).toBe(acc2.id);
    });
  });

  describe('Transaction Repository', () => {
    it('creates income, expense, and updates/deletes transactions', async () => {
      const account = await createAccount({
        name: 'Cash',
        type: 'cash',
        initialBalance: 500,
        currency: 'PHP',
        color: '#FFED9E',
        icon: 'Wallet',
      });

      const expense = await createTransaction({
        amount: 150,
        type: 'expense',
        accountId: account.id,
        categoryId: 'cat-food-dining',
        date: '2026-09-10',
        notes: 'Lunch at Karinderya',
        mood: 'Treat',
      });

      expect(expense.id).toBeDefined();
      expect(expense.amount).toBe(150);
      expect(expense.mood).toBe('Treat');

      // Update transaction
      await updateTransaction(expense.id, {
        amount: 180,
        notes: 'Lunch + Extra rice',
      });

      const all = await getTransactions();
      expect(all[0].amount).toBe(180);
      expect(all[0].notes).toBe('Lunch + Extra rice');

      // Delete transaction
      await deleteTransaction(expense.id);
      expect(await getTransactions()).toHaveLength(0);
    });

    it('creates atomic transfers between two accounts', async () => {
      const source = await createAccount({
        name: 'BPI',
        type: 'bank',
        initialBalance: 20000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'Building2',
      });

      const dest = await createAccount({
        name: 'GCash',
        type: 'ewallet',
        initialBalance: 1000,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'Smartphone',
      });

      const transfer = await createTransfer({
        fromAccountId: source.id,
        toAccountId: dest.id,
        amount: 5000,
        date: '2026-09-11',
        notes: 'Top up GCash',
        mood: 'Essential',
      });

      expect(transfer.id).toBeDefined();
      expect(transfer.type).toBe('transfer');
      expect(transfer.accountId).toBe(source.id);
      expect(transfer.toAccountId).toBe(dest.id);
      expect(transfer.amount).toBe(5000);
      expect(transfer.notes).toBe('Top up GCash');
      expect(transfer.mood).toBe('Essential');

      // Verify it is queryable by both source and destination account
      const sourceTxs = await getTransactions({ accountId: source.id });
      expect(sourceTxs).toHaveLength(1);

      const destTxs = await getTransactions({ accountId: dest.id });
      expect(destTxs).toHaveLength(1);
    });

    it('filters transactions by date, category, type, and account', async () => {
      const accA = await createAccount({
        name: 'Account A',
        type: 'bank',
        initialBalance: 10000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'Building2',
      });

      const accB = await createAccount({
        name: 'Account B',
        type: 'ewallet',
        initialBalance: 5000,
        currency: 'PHP',
        color: '#DAE097',
        icon: 'Smartphone',
      });

      await createTransaction({
        amount: 1000,
        type: 'expense',
        accountId: accA.id,
        categoryId: 'cat-groceries',
        date: '2026-09-01',
      });

      await createTransaction({
        amount: 2500,
        type: 'expense',
        accountId: accA.id,
        categoryId: 'cat-utilities',
        date: '2026-09-05',
      });

      await createTransaction({
        amount: 50000,
        type: 'income',
        accountId: accB.id,
        categoryId: 'cat-salary',
        date: '2026-09-10',
      });

      await createTransfer({
        fromAccountId: accA.id,
        toAccountId: accB.id,
        amount: 3000,
        date: '2026-09-12',
      });

      // Filter by type
      const incomes = await getTransactions({ type: 'income' });
      expect(incomes).toHaveLength(1);
      expect(incomes[0].amount).toBe(50000);

      const expenses = await getTransactions({ type: 'expense' });
      expect(expenses).toHaveLength(2);

      const transfers = await getTransactions({ type: 'transfer' });
      expect(transfers).toHaveLength(1);

      // Filter by category
      const groceries = await getTransactions({ categoryId: 'cat-groceries' });
      expect(groceries).toHaveLength(1);
      expect(groceries[0].amount).toBe(1000);

      // Filter by date range
      const midMonth = await getTransactions({
        startDate: '2026-09-04',
        endDate: '2026-09-11',
      });
      expect(midMonth).toHaveLength(2); // Sept 5 and Sept 10

      // Filter by account (includes both source and destination)
      const accBTxs = await getTransactions({ accountId: accB.id });
      expect(accBTxs).toHaveLength(2); // income into accB and transfer to accB
    });
  });

  describe('Settings Repository', () => {
    it('returns default Philippine settings when empty', async () => {
      const settings = await getUserSettings();
      expect(settings).toEqual({
        currencyCode: 'PHP',
        currencySymbol: '₱',
        currencyLocale: 'en-PH',
        pinEnabled: false,
        autoLockMinutes: 0,
        hasCompletedOnboarding: false,
      });
    });

    it('saves and merges partial user settings without losing other defaults', async () => {
      await saveUserSettings({
        hasCompletedOnboarding: true,
        pinEnabled: true,
        pinHash: '123456_hashed',
      });

      const updated = await getUserSettings();
      expect(updated.hasCompletedOnboarding).toBe(true);
      expect(updated.pinEnabled).toBe(true);
      expect(updated.pinHash).toBe('123456_hashed');
      // Preserved defaults
      expect(updated.currencyCode).toBe('PHP');
      expect(updated.currencySymbol).toBe('₱');
      expect(updated.currencyLocale).toBe('en-PH');
      expect(updated.autoLockMinutes).toBe(0);
    });
  });
});
