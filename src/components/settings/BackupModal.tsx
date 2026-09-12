import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileJson,
  XCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  importFullDatabaseJSON,
  BACKUP_APP_NAME,
  BACKUP_VERSION,
  type BackupEnvelope,
  type ImportBackupResult,
} from '../../services/backupService';

export interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (summary: ImportBackupResult['summary']) => void;
}

/**
 * BackupModal: Restores the local Dexie database vault from a versioned JSON backup envelope.
 * Provides live file parsing, summary schema inspection, overwrite warning, and atomic restore.
 */
export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [parsedEnvelope, setParsedEnvelope] = useState<BackupEnvelope | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const [successSummary, setSuccessSummary] = useState<ImportBackupResult['summary'] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setRawJson(null);
    setParsedEnvelope(null);
    setErrorMessage(null);
    setIsRestoring(false);
    setRestoreSuccess(false);
    setSuccessSummary(null);
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
    setRestoreSuccess(false);
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

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        setErrorMessage('Invalid JSON format: Unable to parse file as valid JSON.');
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      if (!parsed || typeof parsed !== 'object') {
        setErrorMessage('Invalid backup format: Expected a JSON object.');
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      if (typeof parsed.version !== 'number' || parsed.version !== BACKUP_VERSION) {
        setErrorMessage(
          `Unsupported backup version: ${parsed.version ?? 'missing'}. Expected version ${BACKUP_VERSION}.`
        );
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      if (parsed.appName !== BACKUP_APP_NAME) {
        setErrorMessage(
          `Invalid backup: unrecognized application '${parsed.appName ?? 'missing'}'. Expected '${BACKUP_APP_NAME}'.`
        );
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        setErrorMessage('Invalid backup schema: missing required data object.');
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      const { accounts, transactions, categories, settings } = parsed.data;
      if (
        !Array.isArray(accounts) ||
        !Array.isArray(transactions) ||
        !Array.isArray(categories) ||
        !Array.isArray(settings)
      ) {
        setErrorMessage('Invalid backup schema: missing or malformed tables in data.');
        setParsedEnvelope(null);
        setRawJson(null);
        return;
      }

      setParsedEnvelope(parsed as BackupEnvelope);
      setRawJson(text);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read backup file.');
      setParsedEnvelope(null);
      setRawJson(null);
    }
  };

  const handleRestore = async () => {
    if (!rawJson || !parsedEnvelope || isRestoring) return;

    try {
      setIsRestoring(true);
      setErrorMessage(null);

      const result = await importFullDatabaseJSON(rawJson);
      setRestoreSuccess(true);
      setSuccessSummary(result.summary);
      if (onSuccess) {
        onSuccess(result.summary);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to restore database from backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Restore Backup"
      subtitle="Restore your local vault from an exported JSON file"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* File Drop / Selector */}
        {!restoreSuccess && (
          <div>
            <label
              htmlFor="backup-file-upload"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5"
            >
              Select Backup File (.json)
            </label>
            <div className="relative border-2 border-dashed border-[#111111] hover:border-dark-forest rounded-2xl p-4 sm:p-5 bg-white text-center cursor-pointer transition-colors shadow-[2px_2px_0px_0px_#111111]">
              <input
                id="backup-file-upload"
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                data-testid="backup-file-input"
                onChange={handleFileChange}
                disabled={isRestoring}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-[#A6CFF2] border border-[#111111] flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
                  <FileJson className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#111111]">
                  {selectedFile ? selectedFile.name : 'Choose a JSON backup file or drag here'}
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Must be an exported Balangay JSON backup file'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div
            data-testid="backup-error-message"
            className="p-3.5 bg-[#F2C0CA]/30 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-rose-900 shadow-sm"
          >
            <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Backup Preview Summary */}
        {parsedEnvelope && !restoreSuccess && (
          <div
            data-testid="backup-preview-summary"
            className="p-4 bg-[#FFED9E]/30 border border-amber-400/40 rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-stone-800/15">
              <Database className="w-4 h-4 text-dark-forest" />
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Backup Contents Preview
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-800/15 flex items-center justify-between">
                <span className="text-stone-600 font-medium">Accounts:</span>
                <span
                  data-testid="preview-accounts-count"
                  className="font-bold text-[#111111] font-mono text-sm"
                >
                  {parsedEnvelope.data.accounts.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-800/15 flex items-center justify-between">
                <span className="text-stone-600 font-medium">Transactions:</span>
                <span
                  data-testid="preview-transactions-count"
                  className="font-bold text-[#111111] font-mono text-sm"
                >
                  {parsedEnvelope.data.transactions.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-800/15 flex items-center justify-between">
                <span className="text-stone-600 font-medium">Categories:</span>
                <span
                  data-testid="preview-categories-count"
                  className="font-bold text-[#111111] font-mono text-sm"
                >
                  {parsedEnvelope.data.categories.length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-800/15 flex items-center justify-between">
                <span className="text-stone-600 font-medium">Settings:</span>
                <span
                  data-testid="preview-settings-count"
                  className="font-bold text-[#111111] font-mono text-sm"
                >
                  {parsedEnvelope.data.settings.length}
                </span>
              </div>
            </div>

            {/* Overwrite Warning */}
            <div
              data-testid="backup-warning-text"
              className="p-2.5 bg-[#FFFDF9] border border-amber-500/50 rounded-xl flex items-start gap-2 text-xs font-semibold text-amber-900"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">
                Restoring will replace your current local vault with the backup data.
              </span>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {restoreSuccess && (
          <div
            data-testid="backup-success-banner"
            className="p-5 bg-[#DAE097]/40 border border-[#124224]/30 rounded-2xl shadow-sm space-y-3 text-center"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#DAE097] border border-stone-800/15 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-dark-forest" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#111111]">
                Vault Restored Successfully!
              </h4>
              <p className="text-xs text-stone-700 mt-1">
                All records from the backup file have been loaded into your local storage.
              </p>
            </div>
            {successSummary && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-dark-forest pt-1">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#111111]/20">
                  {successSummary.accounts} Accounts
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#111111]/20">
                  {successSummary.transactions} Transactions
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#111111]/20">
                  {successSummary.categories} Categories
                </span>
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
            data-testid="backup-cancel-btn"
          >
            {restoreSuccess ? 'Done' : 'Cancel'}
          </Button>

          {parsedEnvelope && !restoreSuccess && (
            <Button
              type="button"
              variant="forest"
              size="sm"
              isLoading={isRestoring}
              disabled={isRestoring}
              icon={<UploadCloud className="w-3.5 h-3.5" />}
              data-testid="restore-backup-btn"
              onClick={handleRestore}
            >
              Restore Backup
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
