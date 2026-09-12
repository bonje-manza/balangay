import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionFormModal } from './TransactionFormModal';
import { db, resetDatabase } from '../../storage/db';
import type { Account, Category, Transaction } from '../../domain/types';

describe('TransactionFormModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const onDelete = vi.fn();

  const now = new Date().toISOString();

  const testAccounts: Account[] = [
    {
      id: 'acc-gcash',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 2500,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'Smartphone',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-bpi',
      name: 'BPI Savings',
      type: 'bank',
      initialBalance: 15000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Building2',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const testCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
    },
    {
      id: 'cat-groceries',
      name: 'Groceries',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
    },
    {
      id: 'cat-salary',
      name: 'Salary & Wages',
      type: 'income',
      icon: 'Briefcase',
      color: '#DAE097',
    },
  ];

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
    await db.accounts.bulkAdd(testAccounts);
    await db.categories.bulkAdd(testCategories);
  });

  describe('Validation', () => {
    it('requires amount > 0 and prevents submission with error message', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Amount is initially empty (or 0)
      const submitBtn = screen.getByTestId('transaction-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('amount-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('amount-error')).toHaveTextContent(/greater than 0/i);

      // Verify no transaction created in Dexie
      expect(await db.transactions.count()).toBe(0);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('requires category selection for expense and income', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Fill valid amount
      const amountInput = screen.getByTestId('transaction-amount-input');
      fireEvent.change(amountInput, { target: { value: '250' } });

      // Keep category unselected
      const categorySelect = screen.getByTestId('transaction-category-select');
      fireEvent.change(categorySelect, { target: { value: '' } });

      const submitBtn = screen.getByTestId('transaction-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('category-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('category-error')).toHaveTextContent(/category is required/i);
      expect(await db.transactions.count()).toBe(0);
    });

    it('validates transfer requires different source and destination accounts', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Switch to Transfer tab
      const transferTab = screen.getByTestId('type-tab-transfer');
      fireEvent.click(transferTab);

      // Fill amount
      const amountInput = screen.getByTestId('transaction-amount-input');
      fireEvent.change(amountInput, { target: { value: '1000' } });

      // Set source and destination to same account
      const fromSelect = screen.getByTestId('transaction-from-account-select');
      const toSelect = screen.getByTestId('transaction-to-account-select');

      fireEvent.change(fromSelect, { target: { value: 'acc-gcash' } });
      fireEvent.change(toSelect, { target: { value: 'acc-gcash' } });

      const submitBtn = screen.getByTestId('transaction-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('transfer-account-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('transfer-account-error')).toHaveTextContent(
        /source and destination.*must be different/i
      );
      expect(await db.transactions.count()).toBe(0);
    });
  });

  describe('Creating Transactions', () => {
    it('submitting creates an expense in Dexie', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Fill amount
      fireEvent.change(screen.getByTestId('transaction-amount-input'), {
        target: { value: '450.50' },
      });

      // Select Account & Category
      fireEvent.change(screen.getByTestId('transaction-account-select'), {
        target: { value: 'acc-gcash' },
      });
      fireEvent.change(screen.getByTestId('transaction-category-select'), {
        target: { value: 'cat-food' },
      });

      // Date
      fireEvent.change(screen.getByTestId('transaction-date-input'), {
        target: { value: '2026-09-12' },
      });

      // Notes
      fireEvent.change(screen.getByTestId('transaction-notes-input'), {
        target: { value: 'Dinner with friends' },
      });

      // Tags
      fireEvent.change(screen.getByTestId('transaction-tags-input'), {
        target: { value: 'food, weekend' },
      });

      // Mood
      fireEvent.click(screen.getByTestId('mood-pill-treat'));

      // Submit
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(async () => {
        expect(await db.transactions.count()).toBe(1);
      });

      const tx = await db.transactions.toCollection().first();
      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(450.5);
      expect(tx?.type).toBe('expense');
      expect(tx?.accountId).toBe('acc-gcash');
      expect(tx?.categoryId).toBe('cat-food');
      expect(tx?.date).toBe('2026-09-12');
      expect(tx?.notes).toBe('Dinner with friends');
      expect(tx?.tags).toEqual(['food', 'weekend']);
      expect(tx?.mood).toBe('Treat');

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submitting creates an income in Dexie', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Switch to Income tab
      fireEvent.click(screen.getByTestId('type-tab-income'));

      // Fill amount
      fireEvent.change(screen.getByTestId('transaction-amount-input'), {
        target: { value: '35000' },
      });

      // Select Account & Income Category
      fireEvent.change(screen.getByTestId('transaction-account-select'), {
        target: { value: 'acc-bpi' },
      });
      fireEvent.change(screen.getByTestId('transaction-category-select'), {
        target: { value: 'cat-salary' },
      });

      // Notes & Mood
      fireEvent.change(screen.getByTestId('transaction-notes-input'), {
        target: { value: 'Monthly paycheck' },
      });
      fireEvent.click(screen.getByTestId('mood-pill-peaceful'));

      // Submit
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(async () => {
        expect(await db.transactions.count()).toBe(1);
      });

      const tx = await db.transactions.toCollection().first();
      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(35000);
      expect(tx?.type).toBe('income');
      expect(tx?.accountId).toBe('acc-bpi');
      expect(tx?.categoryId).toBe('cat-salary');
      expect(tx?.notes).toBe('Monthly paycheck');
      expect(tx?.mood).toBe('Peaceful');

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submitting creates an atomic transfer via transactionRepository.createTransfer', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Switch to Transfer tab
      fireEvent.click(screen.getByTestId('type-tab-transfer'));

      // Fill amount
      fireEvent.change(screen.getByTestId('transaction-amount-input'), {
        target: { value: '5000' },
      });

      // Select from & to accounts
      fireEvent.change(screen.getByTestId('transaction-from-account-select'), {
        target: { value: 'acc-bpi' },
      });
      fireEvent.change(screen.getByTestId('transaction-to-account-select'), {
        target: { value: 'acc-gcash' },
      });

      // Notes
      fireEvent.change(screen.getByTestId('transaction-notes-input'), {
        target: { value: 'Transfer to GCash' },
      });
      fireEvent.click(screen.getByTestId('mood-pill-essential'));

      // Submit
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(async () => {
        expect(await db.transactions.count()).toBe(1);
      });

      const tx = await db.transactions.toCollection().first();
      expect(tx).toBeDefined();
      expect(tx?.amount).toBe(5000);
      expect(tx?.type).toBe('transfer');
      expect(tx?.accountId).toBe('acc-bpi');
      expect(tx?.toAccountId).toBe('acc-gcash');
      expect(tx?.notes).toBe('Transfer to GCash');
      expect(tx?.mood).toBe('Essential');

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit & Delete Modes', () => {
    it('edit mode pre-fills fields and updates transaction on save', async () => {
      const existingTx: Transaction = {
        id: 'tx-test-edit',
        amount: 800,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-groceries',
        date: '2026-09-10',
        notes: 'Initial grocery run',
        tags: ['groceries'],
        mood: 'Essential',
        createdAt: now,
        updatedAt: now,
      };

      await db.transactions.add(existingTx);

      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          transactionToEdit={existingTx}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
          onDelete={onDelete}
        />
      );

      // Verify pre-filled values
      expect(screen.getByTestId('transaction-amount-input')).toHaveValue(800);
      expect(screen.getByTestId('transaction-notes-input')).toHaveValue('Initial grocery run');
      expect(screen.getByTestId('transaction-account-select')).toHaveValue('acc-gcash');
      expect(screen.getByTestId('transaction-category-select')).toHaveValue('cat-groceries');

      // Update fields
      fireEvent.change(screen.getByTestId('transaction-amount-input'), {
        target: { value: '950' },
      });
      fireEvent.change(screen.getByTestId('transaction-notes-input'), {
        target: { value: 'Updated grocery run with fruits' },
      });

      // Submit update
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(async () => {
        const updated = await db.transactions.get('tx-test-edit');
        expect(updated?.amount).toBe(950);
        expect(updated?.notes).toBe('Updated grocery run with fruits');
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deleting in edit mode removes transaction from database', async () => {
      const existingTx: Transaction = {
        id: 'tx-test-delete',
        amount: 350,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-food',
        date: '2026-09-11',
        notes: 'Coffee to delete',
        createdAt: now,
        updatedAt: now,
      };

      await db.transactions.add(existingTx);
      expect(await db.transactions.count()).toBe(1);

      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          transactionToEdit={existingTx}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
          onDelete={onDelete}
        />
      );

      // Trigger delete
      const deleteBtn = screen.getByTestId('transaction-delete-btn');
      fireEvent.click(deleteBtn);

      // Confirmation prompt
      const confirmBtn = screen.getByTestId('confirm-delete-btn');
      fireEvent.click(confirmBtn);

      await waitFor(async () => {
        expect(await db.transactions.count()).toBe(0);
      });

      expect(onDelete).toHaveBeenCalledWith('tx-test-delete');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
