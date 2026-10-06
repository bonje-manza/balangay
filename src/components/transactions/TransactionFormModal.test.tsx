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

    it('clearing optional fields (notes, tags, mood) on edit clears them in database', async () => {
      const existingTx: Transaction = {
        id: 'tx-test-clear-fields',
        amount: 500,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-food',
        date: '2026-09-11',
        notes: 'Coffee with snacks',
        tags: ['coffee', 'snack'],
        mood: 'Treat',
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

      // Clear notes
      fireEvent.change(screen.getByTestId('transaction-notes-input'), {
        target: { value: '' },
      });

      // Clear tags
      fireEvent.change(screen.getByTestId('transaction-tags-input'), {
        target: { value: '' },
      });

      // Clear mood by clicking the active mood pill
      fireEvent.click(screen.getByTestId('mood-pill-treat'));

      // Submit update
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(async () => {
        const updated = await db.transactions.get('tx-test-clear-fields');
        expect(updated?.notes).toBe('');
        expect(updated?.tags).toEqual([]);
        expect(updated?.mood).toBe('');
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders progressive disclosure accordion for secondary fields', () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      const accordion = screen.getByTestId('transaction-details-accordion');
      expect(accordion).toBeInTheDocument();
      expect(screen.getByText(/Additional Details/i)).toBeInTheDocument();
      expect(screen.getByTestId('transaction-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-notes-input')).toBeInTheDocument();
    });

    it('filters out archived categories for new transactions but retains them when editing', () => {
      const categoriesWithArchived: Category[] = [
        ...testCategories,
        {
          id: 'cat-archived-gym',
          name: 'Archived Gym',
          type: 'expense',
          icon: 'Dumbbell',
          color: '#DAE097',
          isArchived: true,
        },
      ];

      // 1. New transaction: Archived Gym should not be present
      const { unmount } = render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={categoriesWithArchived}
          onSuccess={onSuccess}
        />
      );

      const select = screen.getByTestId('transaction-category-select');
      expect(select).not.toHaveTextContent('Archived Gym');
      expect(select).toHaveTextContent('Food & Dining');
      unmount();

      // 2. Edit transaction that was saved with Archived Gym: should be visible
      const existingTxWithArchivedCat: Transaction = {
        id: 'tx-archived-cat',
        amount: 1200,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-archived-gym',
        date: '2026-08-15',
        createdAt: now,
        updatedAt: now,
      };

      render(
        <TransactionFormModal
          isOpen={true}
          transactionToEdit={existingTxWithArchivedCat}
          onClose={onClose}
          accounts={testAccounts}
          categories={categoriesWithArchived}
          onSuccess={onSuccess}
        />
      );

      const editSelect = screen.getByTestId('transaction-category-select') as HTMLSelectElement;
      expect(editSelect).toHaveTextContent('Archived Gym');
      expect(editSelect.value).toBe('cat-archived-gym');
    });

    it('pre-fills custom initialDate when provided', () => {
      render(
        <TransactionFormModal
          isOpen={true}
          initialDate="2026-09-22"
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      const dateInput = screen.getByTestId('transaction-date-input') as HTMLInputElement;
      expect(dateInput.value).toBe('2026-09-22');
    });

    it('switches to Adjust tab, displays tracked balance, previews diff, and saves adjustment', async () => {
      // GCash has initialBalance 2500
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      // Switch to Adjust tab
      const adjustTab = screen.getByTestId('type-tab-adjustment');
      expect(adjustTab).toHaveTextContent('Adjust');
      fireEvent.click(adjustTab);

      // Category select should be hidden
      expect(screen.queryByTestId('transaction-category-select')).not.toBeInTheDocument();

      // Current tracked balance should display ₱2,500.00 for GCash
      expect(screen.getByTestId('current-tracked-balance')).toHaveTextContent(/₱2,500\.00/);

      // Target balance input
      const targetInput = screen.getByTestId('adjustment-target-balance-input');
      expect(targetInput).toBeInTheDocument();

      // If target matches current (2500), preview shows zero diff and submit is disabled
      fireEvent.change(targetInput, { target: { value: '2500' } });
      expect(screen.getByTestId('adjustment-zero-diff')).toHaveTextContent(/already matches/i);
      expect(screen.getByTestId('transaction-submit-btn')).toBeDisabled();

      // Type 3200 (increase by 700)
      fireEvent.change(targetInput, { target: { value: '3200' } });
      expect(screen.getByTestId('adjustment-diff-preview')).toHaveTextContent(/\+₱700\.00/);
      expect(screen.getByTestId('transaction-submit-btn')).not.toBeDisabled();

      // Type notes
      const notesInput = screen.getByTestId('transaction-notes-input');
      fireEvent.change(notesInput, { target: { value: 'Untracked pocket money' } });

      // Submit
      fireEvent.click(screen.getByTestId('transaction-submit-btn'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });

      const txs = await db.transactions.toArray();
      expect(txs).toHaveLength(1);
      expect(txs[0].type).toBe('adjustment');
      expect(txs[0].amount).toBe(700);
      expect(txs[0].adjustmentDirection).toBe('increase');
      expect(txs[0].targetBalance).toBe(3200);
      expect(txs[0].notes).toBe('Untracked pocket money');
    });

    it('pre-populates when editing an existing adjustment transaction', () => {
      const existingAdj: Transaction = {
        id: 'tx-adj-edit',
        amount: 300,
        type: 'adjustment',
        adjustmentDirection: 'decrease',
        targetBalance: 2200,
        accountId: 'acc-gcash',
        date: '2026-09-15',
        notes: 'Forgot cash payment',
        createdAt: now,
        updatedAt: now,
      };

      render(
        <TransactionFormModal
          isOpen={true}
          transactionToEdit={existingAdj}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          onSuccess={onSuccess}
        />
      );

      const targetInput = screen.getByTestId('adjustment-target-balance-input') as HTMLInputElement;
      expect(targetInput.value).toBe('2200');
      expect(screen.getByTestId('transaction-notes-input')).toHaveValue('Forgot cash payment');
    });
  });

  describe('Note Autocomplete Suggestions', () => {
    const historicalTransactions: Transaction[] = [
      {
        id: 'hist-1',
        amount: 450,
        type: 'expense',
        accountId: 'acc-gcash',
        date: '2026-10-01',
        notes: 'Ramen Nagi with team',
        createdAt: '2026-10-01T12:00:00Z',
        updatedAt: '2026-10-01T12:00:00Z',
      },
      {
        id: 'hist-2',
        amount: 150,
        type: 'expense',
        accountId: 'acc-gcash',
        date: '2026-10-02',
        notes: 'Ramen Kuroda quick lunch',
        createdAt: '2026-10-02T12:00:00Z',
        updatedAt: '2026-10-02T12:00:00Z',
      },
      {
        id: 'hist-3',
        amount: 300,
        type: 'expense',
        accountId: 'acc-gcash',
        date: '2026-10-03',
        notes: 'Grab car to office',
        createdAt: '2026-10-03T12:00:00Z',
        updatedAt: '2026-10-03T12:00:00Z',
      },
    ];

    it('shows matching note suggestions when user types in Note field', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          transactions={historicalTransactions}
          onSuccess={onSuccess}
        />
      );

      const notesInput = screen.getByTestId('transaction-notes-input');
      fireEvent.change(notesInput, { target: { value: 'ramen' } });

      expect(screen.getByTestId('note-suggestions-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('note-suggestion-0')).toHaveTextContent(/Ramen Kuroda quick lunch/i);
      expect(screen.getByTestId('note-suggestion-1')).toHaveTextContent(/Ramen Nagi with team/i);
      expect(screen.queryByText(/Grab car to office/i)).not.toBeInTheDocument();
    });

    it('populates note input and closes dropdown when suggestion is clicked', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          transactions={historicalTransactions}
          onSuccess={onSuccess}
        />
      );

      const notesInput = screen.getByTestId('transaction-notes-input');
      fireEvent.change(notesInput, { target: { value: 'nagi' } });

      const suggestionItem = screen.getByTestId('note-suggestion-0');
      fireEvent.click(suggestionItem);

      expect(notesInput).toHaveValue('Ramen Nagi with team');
      expect(screen.queryByTestId('note-suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('supports keyboard navigation with ArrowDown and Enter to select suggestion', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          transactions={historicalTransactions}
          onSuccess={onSuccess}
        />
      );

      const notesInput = screen.getByTestId('transaction-notes-input');
      fireEvent.change(notesInput, { target: { value: 'ramen' } });

      // hist-2 is from 2026-10-02 (more recent than hist-1 2026-10-01), so index 0 is Kuroda
      fireEvent.keyDown(notesInput, { key: 'ArrowDown' });
      fireEvent.keyDown(notesInput, { key: 'Enter' });

      expect(notesInput).toHaveValue('Ramen Kuroda quick lunch');
      expect(screen.queryByTestId('note-suggestions-dropdown')).not.toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('closes suggestions when Escape key is pressed without closing modal', async () => {
      render(
        <TransactionFormModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          categories={testCategories}
          transactions={historicalTransactions}
          onSuccess={onSuccess}
        />
      );

      const notesInput = screen.getByTestId('transaction-notes-input');
      fireEvent.change(notesInput, { target: { value: 'ram' } });
      expect(screen.getByTestId('note-suggestions-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(notesInput, { key: 'Escape' });
      expect(screen.queryByTestId('note-suggestions-dropdown')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

