import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  parseCSV,
  importTransactionsFromCSV,
  type ImportCSVResult,
} from '../../services/csvService';
import { db } from '../../storage/db';
import type { Account } from '../../domain/types';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts?: Account[];
  onSuccess?: (result: ImportCSVResult) => void;
}

/**
 * CsvImportModal: Modal dialog for importing bank, GCash, or Maya CSV statement files.
 * Previews transaction row counts, lets user select default account, runs parser,
 * and reports imported totals with skipped rows.
 */
export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  accounts: propAccounts,
  onSuccess,
}) => {
  const [loadedAccounts, setLoadedAccounts] = useState<Account[]>(propAccounts || []);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawCsv, setRawCsv] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportCSVResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load accounts if not supplied via props
  useEffect(() => {
    let isSubscribed = true;

    if (propAccounts && propAccounts.length > 0) {
      setLoadedAccounts(propAccounts);
      if (!selectedAccountId) {
        setSelectedAccountId(propAccounts[0].id);
      }
    } else if (isOpen) {
      db.accounts.toArray().then((dbAccounts) => {
        if (!isSubscribed) return;
        setLoadedAccounts(dbAccounts);
        if (dbAccounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(dbAccounts[0].id);
        }
      });
    }

    return () => {
      isSubscribed = false;
    };
  }, [propAccounts, isOpen, selectedAccountId]);

  // Sync selected account if accounts change
  useEffect(() => {
    if (loadedAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(loadedAccounts[0].id);
    }
  }, [loadedAccounts, selectedAccountId]);

  const resetState = () => {
    setSelectedFile(null);
    setRawCsv(null);
    setRowCount(0);
    setErrorMessage(null);
    setIsImporting(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setImportResult(null);
    setSelectedFile(file);

    try {
      const text =
        typeof file.text === 'function'
          ? await file.text()
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsText(file);
            });

      if (!text || !text.trim()) {
        setErrorMessage('The uploaded CSV file is empty. Please select a valid statement.');
        setRawCsv(null);
        setRowCount(0);
        return;
      }

      const rows = parseCSV(text);
      // Row 0 is header row. Rows with data must be at least 1 row after header.
      const candidateRows = rows.filter((r) => r.some((c) => c.trim().length > 0));

      if (candidateRows.length <= 1) {
        setErrorMessage('The uploaded CSV file contains only headers with no data rows.');
        setRawCsv(null);
        setRowCount(0);
        return;
      }

      setRowCount(candidateRows.length - 1);
      setRawCsv(text);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read CSV file.');
      setRawCsv(null);
      setRowCount(0);
    }
  };

  const handleImport = async () => {
    if (!rawCsv || !selectedAccountId || isImporting) return;

    try {
      setIsImporting(true);
      setErrorMessage(null);

      const result = await importTransactionsFromCSV(rawCsv, {
        defaultAccountId: selectedAccountId,
      });

      setImportResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to import CSV transactions.');
    } finally {
      setIsImporting(false);
    }
  };

  const hasImportedSuccessfully = Boolean(importResult && importResult.imported > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Import Statement (CSV)"
      subtitle="Import transactions from GCash, Maya, or bank CSV exports"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Account Selection */}
        <div>
          <label
            htmlFor="csv-account-selector"
            className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
          >
            Default Account *
          </label>
          <select
            id="csv-account-selector"
            data-testid="csv-account-select"
            value={selectedAccountId}
            disabled={isImporting || hasImportedSuccessfully}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border-2 border-[#111111] text-xs font-bold text-stone-800 shadow-[2px_2px_0px_0px_#111111] focus:outline-none focus:ring-2 focus:ring-[#124224]"
          >
            {loadedAccounts.length === 0 ? (
              <option value="">No accounts found</option>
            ) : (
              loadedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-stone-500 mt-1">
            Transactions without an explicit account name in the CSV will be assigned here.
          </p>
        </div>

        {/* CSV File Upload Drop */}
        {!hasImportedSuccessfully && (
          <div>
            <label
              htmlFor="csv-file-upload"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Select CSV Statement
            </label>
            <div className="relative border border-dashed border-stone-800/30 hover:border-stone-800 rounded-2xl p-4 sm:p-5 bg-white text-center cursor-pointer transition-colors shadow-sm">
              <input
                id="csv-file-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                data-testid="csv-file-input"
                onChange={handleFileChange}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-[#DAE097] border border-stone-800/15 flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#111111]">
                  {selectedFile ? selectedFile.name : 'Choose a .csv statement or drag here'}
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Supports standard GCash, Maya, and universal CSV layouts'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div
            data-testid="csv-error-message"
            className="p-3.5 bg-[#F2C0CA]/30 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-rose-900 shadow-sm"
          >
            <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Preview Summary */}
        {rowCount > 0 && !hasImportedSuccessfully && (
          <div
            data-testid="csv-preview-summary"
            className="p-3.5 bg-[#FFED9E]/30 border border-amber-400/40 rounded-2xl shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-dark-forest" />
              <span className="text-xs font-bold text-[#111111]">
                Found{' '}
                <span
                  data-testid="csv-preview-rows-count"
                  className="font-mono text-sm underline decoration-stone-800"
                >
                  {rowCount}
                </span>{' '}
                transaction row{rowCount === 1 ? '' : 's'} to import
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-stone-800/20 font-bold text-[#111111]">
              Ready
            </span>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3">
            {importResult.imported > 0 && (
              <div
                data-testid="csv-success-banner"
                className="p-4 bg-[#DAE097]/40 border border-[#124224]/30 rounded-2xl shadow-sm flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#DAE097] border border-stone-800/15 flex items-center justify-center shadow-sm flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-dark-forest" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#111111]">
                    Import Complete
                  </h4>
                  <p className="text-xs font-bold text-dark-forest mt-0.5">
                    Successfully imported {importResult.imported} transaction
                    {importResult.imported === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <div
                data-testid="csv-errors-list"
                className="p-3 bg-[#F2C0CA]/30 border border-rose-300 rounded-2xl shadow-sm space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Skipped {importResult.errors.length} row(s) with errors:</span>
                </div>
                <ul className="text-[11px] text-rose-800 list-disc list-inside max-h-32 overflow-y-auto space-y-0.5 font-medium pl-1">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-stone-800/10 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleModalClose}
            data-testid="csv-cancel-btn"
          >
            {hasImportedSuccessfully ? 'Done' : 'Cancel'}
          </Button>

          {rowCount > 0 && !hasImportedSuccessfully && (
            <Button
              type="button"
              variant="forest"
              size="sm"
              isLoading={isImporting}
              disabled={isImporting || !selectedAccountId}
              icon={<Upload className="w-3.5 h-3.5" />}
              data-testid="csv-import-btn"
              onClick={handleImport}
            >
              Import Transactions
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
