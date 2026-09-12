import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransferModal } from './TransferModal';
import { db, resetDatabase } from '../../storage/db';
import type { Account } from '../../domain/types';

describe('TransferModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const now = new Date().toISOString();

  const testAccounts: Account[] = [
    {
      id: 'acc-gcash',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 5000,
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
      initialBalance: 25000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Building2',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-maya',
      name: 'Maya',
      type: 'ewallet',
      initialBalance: 3000,
      currency: 'PHP',
      color: '#DAE097',
      icon: 'Smartphone',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
    await db.accounts.bulkAdd(testAccounts);
  });

  describe('Validation', () => {
    it('requires amount > 0 and prevents submission with error message', async () => {
      render(
        <TransferModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          onSuccess={onSuccess}
        />
      );

      // Amount is empty
      const submitBtn = screen.getByTestId('transfer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('transfer-amount-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('transfer-amount-error')).toHaveTextContent(/greater than 0/i);
      expect(await db.transactions.count()).toBe(0);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('requires different source and destination accounts', async () => {
      render(
        <TransferModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          onSuccess={onSuccess}
        />
      );

      // Fill amount
      fireEvent.change(screen.getByTestId('transfer-amount-input'), {
        target: { value: '1500' },
      });

      // Select same account for source and destination
      fireEvent.change(screen.getByTestId('transfer-from-account-select'), {
        target: { value: 'acc-gcash' },
      });
      fireEvent.change(screen.getByTestId('transfer-to-account-select'), {
        target: { value: 'acc-gcash' },
      });

      const submitBtn = screen.getByTestId('transfer-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('transfer-accounts-error')).toBeInTheDocument();
      });
      expect(screen.getByTestId('transfer-accounts-error')).toHaveTextContent(
        /source and destination.*must be different/i
      );
      expect(await db.transactions.count()).toBe(0);
    });
  });

  describe('Pre-selection & Submitting Transfers', () => {
    it('pre-selects source account when sourceAccountId is provided', () => {
      render(
        <TransferModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          sourceAccountId="acc-bpi"
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByTestId('transfer-from-account-select')).toHaveValue('acc-bpi');
      // Destination should default to another account
      expect(screen.getByTestId('transfer-to-account-select')).not.toHaveValue('acc-bpi');
    });

    it('submitting executes createTransfer and closes modal', async () => {
      render(
        <TransferModal
          isOpen={true}
          onClose={onClose}
          accounts={testAccounts}
          sourceAccountId="acc-bpi"
          onSuccess={onSuccess}
        />
      );

      // Fill amount
      fireEvent.change(screen.getByTestId('transfer-amount-input'), {
        target: { value: '3500' },
      });

      // Select destination
      fireEvent.change(screen.getByTestId('transfer-to-account-select'), {
        target: { value: 'acc-gcash' },
      });

      // Fill date
      fireEvent.change(screen.getByTestId('transfer-date-input'), {
        target: { value: '2026-09-12' },
      });

      // Fill notes
      fireEvent.change(screen.getByTestId('transfer-notes-input'), {
        target: { value: 'Allowance funding' },
      });

      // Select mood
      fireEvent.click(screen.getByTestId('transfer-mood-essential'));

      // Submit
      fireEvent.click(screen.getByTestId('transfer-submit-btn'));

      await waitFor(async () => {
        expect(await db.transactions.count()).toBe(1);
      });

      const tx = await db.transactions.toCollection().first();
      expect(tx).toBeDefined();
      expect(tx?.type).toBe('transfer');
      expect(tx?.amount).toBe(3500);
      expect(tx?.accountId).toBe('acc-bpi');
      expect(tx?.toAccountId).toBe('acc-gcash');
      expect(tx?.date).toBe('2026-09-12');
      expect(tx?.notes).toBe('Allowance funding');
      expect(tx?.mood).toBe('Essential');

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
