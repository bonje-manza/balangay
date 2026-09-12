import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountFormModal } from './AccountFormModal';
import { db, resetDatabase } from '../../storage/db';
import type { Account, Transaction } from '../../domain/types';

describe('AccountFormModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const onDelete = vi.fn();

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('rejects empty name and displays validation error', async () => {
      render(
        <AccountFormModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const submitBtn = screen.getByTestId('account-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('account-name-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('account-name-error')).toHaveTextContent(/account name is required/i);
      expect(await db.accounts.count()).toBe(0);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Preset buttons', () => {
    it('clicking preset button populates name, type, and color', async () => {
      render(
        <AccountFormModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      // Click GCash preset button
      const gcashPresetBtn = screen.getByTestId('preset-btn-gcash');
      fireEvent.click(gcashPresetBtn);

      const nameInput = screen.getByTestId('account-name-input');
      const typeSelect = screen.getByTestId('account-type-select');

      expect(nameInput).toHaveValue('GCash');
      expect(typeSelect).toHaveValue('ewallet');

      // Click Maya preset button
      const mayaPresetBtn = screen.getByTestId('preset-btn-maya');
      fireEvent.click(mayaPresetBtn);

      expect(nameInput).toHaveValue('Maya');
      expect(typeSelect).toHaveValue('ewallet');

      // Click BPI preset button
      const bpiPresetBtn = screen.getByTestId('preset-btn-bpi');
      fireEvent.click(bpiPresetBtn);

      expect(nameInput).toHaveValue('BPI');
      expect(typeSelect).toHaveValue('bank');
    });
  });

  describe('Creating Accounts', () => {
    it('creates new account with valid fields in Dexie', async () => {
      render(
        <AccountFormModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      // Fill name
      fireEvent.change(screen.getByTestId('account-name-input'), {
        target: { value: 'UnionBank Online' },
      });

      // Select type
      fireEvent.change(screen.getByTestId('account-type-select'), {
        target: { value: 'bank' },
      });

      // Fill initial balance
      fireEvent.change(screen.getByTestId('account-balance-input'), {
        target: { value: '12500' },
      });

      // Choose color
      fireEvent.click(screen.getByTestId('color-option-#FFED9E'));

      // Choose icon
      fireEvent.click(screen.getByTestId('icon-option-Landmark'));

      // Submit
      fireEvent.click(screen.getByTestId('account-submit-btn'));

      await waitFor(async () => {
        expect(await db.accounts.count()).toBe(1);
      });

      const acc = await db.accounts.toCollection().first();
      expect(acc).toBeDefined();
      expect(acc?.name).toBe('UnionBank Online');
      expect(acc?.type).toBe('bank');
      expect(acc?.initialBalance).toBe(12500);
      expect(acc?.color).toBe('#FFED9E');
      expect(acc?.icon).toBe('Landmark');
      expect(acc?.currency).toBe('PHP');

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edit & Delete Modes', () => {
    it('edit mode pre-fills data and updates account on save', async () => {
      const existingAccount: Account = {
        id: 'acc-test-edit',
        name: 'My Maya Wallet',
        type: 'ewallet',
        initialBalance: 3000,
        currency: 'PHP',
        color: '#DAE097',
        icon: 'Smartphone',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.accounts.add(existingAccount);

      render(
        <AccountFormModal
          isOpen={true}
          onClose={onClose}
          accountToEdit={existingAccount}
          onSuccess={onSuccess}
          onDelete={onDelete}
        />
      );

      // Pre-filled values
      expect(screen.getByTestId('account-name-input')).toHaveValue('My Maya Wallet');
      expect(screen.getByTestId('account-type-select')).toHaveValue('ewallet');
      expect(screen.getByTestId('account-balance-input')).toHaveValue(3000);

      // Update name and balance
      fireEvent.change(screen.getByTestId('account-name-input'), {
        target: { value: 'Maya Personal' },
      });
      fireEvent.change(screen.getByTestId('account-balance-input'), {
        target: { value: '4500' },
      });

      // Submit update
      fireEvent.click(screen.getByTestId('account-submit-btn'));

      await waitFor(async () => {
        const updated = await db.accounts.get('acc-test-edit');
        expect(updated?.name).toBe('Maya Personal');
        expect(updated?.initialBalance).toBe(4500);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('delete mode calls deleteAccount with confirmation and cleans up transactions', async () => {
      const existingAccount: Account = {
        id: 'acc-to-delete',
        name: 'Old Savings',
        type: 'savings',
        initialBalance: 1000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'PiggyBank',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const linkedTx: Transaction = {
        id: 'tx-linked-acc',
        amount: 500,
        type: 'expense',
        accountId: 'acc-to-delete',
        date: '2026-09-12',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.accounts.add(existingAccount);
      await db.transactions.add(linkedTx);

      expect(await db.accounts.count()).toBe(1);
      expect(await db.transactions.count()).toBe(1);

      render(
        <AccountFormModal
          isOpen={true}
          onClose={onClose}
          accountToEdit={existingAccount}
          onSuccess={onSuccess}
          onDelete={onDelete}
        />
      );

      // Click delete button
      const deleteBtn = screen.getByTestId('account-delete-btn');
      fireEvent.click(deleteBtn);

      // Verify confirmation warning is displayed
      expect(screen.getByTestId('delete-warning-text')).toBeInTheDocument();

      // Click confirm delete
      const confirmBtn = screen.getByTestId('confirm-delete-account-btn');
      fireEvent.click(confirmBtn);

      await waitFor(async () => {
        expect(await db.accounts.count()).toBe(0);
        expect(await db.transactions.count()).toBe(0);
      });

      expect(onDelete).toHaveBeenCalledWith('acc-to-delete');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
