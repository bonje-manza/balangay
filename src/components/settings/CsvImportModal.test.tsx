import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CsvImportModal } from './CsvImportModal';
import * as csvService from '../../services/csvService';
import type { Account } from '../../domain/types';

describe('CsvImportModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const mockAccounts: Account[] = [
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
    {
      id: 'acc-bpi',
      name: 'BPI Savings',
      type: 'bank',
      initialBalance: 15000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Building2',
      isArchived: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const sampleCsv = `Date,Type,Amount (PHP),Account,Category,Notes
2026-09-01,expense,150.00,GCash,Food & Dining,Lunch
2026-09-02,income,5000.00,GCash,Salary,Side Project
2026-09-03,expense,250.00,GCash,Transpo,Grab ride`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal dialog with file input and default account selector', () => {
    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Import Statement \(CSV\)/i);
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('csv-account-select')).toBeInTheDocument();
    expect(screen.getByTestId('csv-account-select')).toHaveValue('acc-gcash');
  });

  it('valid CSV file upload shows row count preview', async () => {
    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        onSuccess={onSuccess}
      />
    );

    const file = new File([sampleCsv], 'gcash_statement.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('csv-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('csv-preview-summary')).toBeInTheDocument();
    });

    expect(screen.getByTestId('csv-preview-rows-count')).toHaveTextContent('3');
    expect(screen.getByTestId('csv-import-btn')).toBeEnabled();
  });

  it('clicking "Import Transactions" executes importTransactionsFromCSV and displays imported summary', async () => {
    const importSpy = vi.spyOn(csvService, 'importTransactionsFromCSV').mockResolvedValue({
      imported: 3,
      errors: [],
    });

    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        onSuccess={onSuccess}
      />
    );

    const file = new File([sampleCsv], 'gcash_statement.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('csv-file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Change account selection to BPI
    const accountSelect = screen.getByTestId('csv-account-select');
    fireEvent.change(accountSelect, { target: { value: 'acc-bpi' } });

    await waitFor(() => {
      expect(screen.getByTestId('csv-import-btn')).toBeEnabled();
    });

    const importBtn = screen.getByTestId('csv-import-btn');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(sampleCsv, {
        defaultAccountId: 'acc-bpi',
      });
      expect(screen.getByTestId('csv-success-banner')).toBeInTheDocument();
      expect(screen.getByTestId('csv-success-banner')).toHaveTextContent(/Successfully imported 3 transactions/i);
      expect(onSuccess).toHaveBeenCalledWith({
        imported: 3,
        errors: [],
      });
    });
  });

  it('displays skipped row messages when import returns errors', async () => {
    vi.spyOn(csvService, 'importTransactionsFromCSV').mockResolvedValue({
      imported: 1,
      errors: ['Row 3: Invalid date "not-a-date"', 'Row 4: Missing amount'],
    });

    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        onSuccess={onSuccess}
      />
    );

    const file = new File([sampleCsv], 'statement.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('csv-import-btn')).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId('csv-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('csv-errors-list')).toBeInTheDocument();
      expect(screen.getByText(/Row 3: Invalid date "not-a-date"/i)).toBeInTheDocument();
      expect(screen.getByText(/Row 4: Missing amount/i)).toBeInTheDocument();
    });
  });

  it('shows error when uploaded CSV file is empty', async () => {
    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
      />
    );

    const emptyFile = new File([''], 'empty.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [emptyFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('csv-error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('csv-error-message')).toHaveTextContent(/empty/i);
    expect(screen.queryByTestId('csv-import-btn')).toBeNull();
  });

  it('clicking cancel or close invokes onClose callback', () => {
    render(
      <CsvImportModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
      />
    );

    const cancelBtn = screen.getByTestId('csv-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
