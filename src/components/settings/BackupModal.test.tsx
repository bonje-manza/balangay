import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackupModal } from './BackupModal';
import * as backupService from '../../services/backupService';
import { resetDatabase } from '../../storage/db';

describe('BackupModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  const validBackupEnvelope: backupService.BackupEnvelope = {
    version: 1,
    appName: 'Balangay Finance Tracker',
    exportedAt: '2026-09-12T12:00:00.000Z',
    data: {
      accounts: [
        {
          id: 'acc-gcash',
          name: 'GCash',
          type: 'ewallet',
          initialBalance: 2500,
          currency: 'PHP',
          color: '#A6CFF2',
          icon: 'Smartphone',
          isArchived: false,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          amount: 500,
          type: 'expense',
          accountId: 'acc-gcash',
          date: '2026-09-02',
          createdAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
        },
        {
          id: 'tx-2',
          amount: 2000,
          type: 'income',
          accountId: 'acc-gcash',
          date: '2026-09-03',
          createdAt: '2026-09-03T00:00:00.000Z',
          updatedAt: '2026-09-03T00:00:00.000Z',
        },
      ],
      categories: [
        {
          id: 'cat-food',
          name: 'Food & Dining',
          type: 'expense',
          icon: 'Utensils',
          color: '#FFED9E',
        },
      ],
      settings: [
        {
          key: 'user_settings',
          value: { currencyCode: 'PHP' },
        },
      ],
    },
  };

  it('renders modal dialog when isOpen is true', () => {
    render(<BackupModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Restore Backup/i);
    expect(screen.getByTestId('backup-file-input')).toBeInTheDocument();
  });

  it('valid JSON file upload parses envelope and shows record count preview', async () => {
    render(<BackupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);

    const jsonString = JSON.stringify(validBackupEnvelope);
    const file = new File([jsonString], 'balangay-backup.json', { type: 'application/json' });

    const fileInput = screen.getByTestId('backup-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-preview-summary')).toBeInTheDocument();
    });

    expect(screen.getByTestId('preview-accounts-count')).toHaveTextContent('1');
    expect(screen.getByTestId('preview-transactions-count')).toHaveTextContent('2');
    expect(screen.getByTestId('preview-categories-count')).toHaveTextContent('1');
    expect(screen.getByTestId('preview-settings-count')).toHaveTextContent('1');

    // Check warning message
    expect(screen.getByTestId('backup-warning-text')).toHaveTextContent(
      'Restoring will replace your current local vault with the backup data.'
    );

    // Restore button is enabled
    const restoreBtn = screen.getByTestId('restore-backup-btn');
    expect(restoreBtn).toBeEnabled();
  });

  it('clicking "Restore Backup" executes importFullDatabaseJSON and displays success feedback', async () => {
    const importSpy = vi.spyOn(backupService, 'importFullDatabaseJSON').mockResolvedValue({
      success: true,
      summary: {
        accounts: 1,
        transactions: 2,
        categories: 1,
        settings: 1,
      },
    });

    render(<BackupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);

    const jsonString = JSON.stringify(validBackupEnvelope);
    const file = new File([jsonString], 'balangay-backup.json', { type: 'application/json' });

    const fileInput = screen.getByTestId('backup-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('restore-backup-btn')).toBeEnabled();
    });

    const restoreBtn = screen.getByTestId('restore-backup-btn');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(jsonString);
      expect(screen.getByTestId('backup-success-banner')).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledWith({
        accounts: 1,
        transactions: 2,
        categories: 1,
        settings: 1,
      });
    });
  });

  it('invalid JSON displays error message and disables restore button', async () => {
    render(<BackupModal isOpen={true} onClose={onClose} />);

    const badFile = new File(['this is not json { ['], 'corrupt.json', {
      type: 'application/json',
    });

    const fileInput = screen.getByTestId('backup-file-input');
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('backup-error-message')).toHaveTextContent(/Invalid JSON/i);
    expect(screen.queryByTestId('restore-backup-btn')).toBeNull();
  });

  it('rejects JSON envelope with invalid appName or unsupported version', async () => {
    render(<BackupModal isOpen={true} onClose={onClose} />);

    const invalidEnvelope = {
      version: 99,
      appName: 'Other App',
      data: {},
    };
    const file = new File([JSON.stringify(invalidEnvelope)], 'wrong.json', {
      type: 'application/json',
    });

    const fileInput = screen.getByTestId('backup-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('backup-error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('backup-error-message')).toHaveTextContent(
      /unsupported backup version|unrecognized application/i
    );
  });

  it('clicking cancel or close invokes onClose callback', () => {
    render(<BackupModal isOpen={true} onClose={onClose} />);

    const cancelBtn = screen.getByTestId('backup-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
