import React, { useState } from 'react';
import {
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
} from 'lucide-react';
import { BentoCard } from '../ui/BentoCard';
import { Button } from '../ui/Button';
import { StickerBadge } from '../ui/StickerBadge';
import { useSecurity } from '../../context/SecurityContext';
import { exportFullDatabaseJSON } from '../../services/backupService';
import { loadSampleDemoData } from '../../storage/seedData';
import { resetDatabase } from '../../storage/db';
import { saveUserSettings } from '../../storage/settingsRepository';
import { BackupModal } from './BackupModal';
import { CsvImportModal } from './CsvImportModal';
import { PinSettingsModal, type PinModalMode } from './PinSettingsModal';

export interface SettingsViewProps {
  onDataReset?: () => void;
  onDataLoaded?: () => void;
  className?: string;
}

/**
 * SettingsView: Complete settings and vault management screen.
 * Configures currency localization, security PIN protection with auto-lock timers,
 * JSON database backups & restores, CSV statement imports, and demo sample data / vault reset.
 */
export const SettingsView: React.FC<SettingsViewProps> = ({
  onDataReset,
  onDataLoaded,
  className = '',
}) => {
  const security = useSecurity();

  // Modals state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('set');

  // Backup export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Demo data state
  const [showDemoConfirm, setShowDemoConfirm] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [demoLoadedBanner, setDemoLoadedBanner] = useState<boolean>(false);

  // Reset vault state (Double confirmation)
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessBanner, setResetSuccessBanner] = useState<boolean>(false);

  // Handle Export Full Database JSON
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setExportFeedback(null);

      const json = await exportFullDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const nowStr = new Date().toISOString().slice(0, 10);
      const filename = `balangay-backup-${nowStr}.json`;

      const downloadUrl =
        typeof window.URL.createObjectURL === 'function'
          ? window.URL.createObjectURL(blob)
          : 'data:application/json;charset=utf-8,' + encodeURIComponent(json);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      if (typeof window.URL.revokeObjectURL === 'function') {
        window.URL.revokeObjectURL(downloadUrl);
      }

      setExportFeedback(`Backup saved as ${filename}`);
      setTimeout(() => setExportFeedback(null), 4000);
    } catch {
      setExportFeedback('Failed to generate backup export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Load Sample Demo Data
  const handleConfirmLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await loadSampleDemoData();
      setShowDemoConfirm(false);
      setDemoLoadedBanner(true);
      if (onDataLoaded) {
        onDataLoaded();
      }
      setTimeout(() => setDemoLoadedBanner(false), 5000);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Handle Reset Entire Vault
  const handleConfirmResetFinal = async () => {
    try {
      setIsResetting(true);
      await resetDatabase();
      await saveUserSettings({
        hasCompletedOnboarding: false,
        pinEnabled: false,
        pinHash: undefined,
        autoLockMinutes: 0,
      });

      // Clear pin in security state if active
      if (security.isPinSet) {
        try {
          await security.removePin('');
        } catch {
          // ignore if removePin validates
        }
      }

      setResetStep(0);
      setResetSuccessBanner(true);
      if (onDataReset) {
        onDataReset();
      }
      setTimeout(() => setResetSuccessBanner(false), 5000);
    } finally {
      setIsResetting(false);
    }
  };

  const getPinStatusBadge = () => {
    if (security.isLocked) {
      return (
        <StickerBadge
          variant="blossom"
          icon={<Lock className="w-3 h-3 text-rose-800" />}
          data-testid="pin-status-badge"
        >
          Locked
        </StickerBadge>
      );
    }
    if (security.isPinSet) {
      return (
        <StickerBadge
          variant="pistachio"
          icon={<ShieldCheck className="w-3 h-3 text-dark-forest" />}
          data-testid="pin-status-badge"
        >
          Protected
        </StickerBadge>
      );
    }
    return (
      <StickerBadge
        variant="butter"
        icon={<ShieldAlert className="w-3 h-3 text-stone-700" />}
        data-testid="pin-status-badge"
      >
        Disabled
      </StickerBadge>
    );
  };

  return (
    <div className={`min-h-full bg-[#F7F2E8] p-4 sm:p-8 space-y-6 ${className}`}>
      {/* View Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-dark-anchor/10 pb-5">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-4xl text-[#111111] tracking-tight">
            Settings & Vault Tools
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
            Privacy controls, offline backups, bank imports, and vault management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StickerBadge variant="pistachio" icon={<Coins className="w-3 h-3 text-dark-forest" />}>
            Local-First
          </StickerBadge>
          <StickerBadge variant="butter" icon={<Globe className="w-3 h-3 text-dark-anchor" />}>
            ₱ PHP Active
          </StickerBadge>
        </div>
      </div>

      {/* Responsive Bento Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Bento 1: Localization & Currency */}
        <BentoCard
          variant="oat"
          sticker={
            <div className="w-9 h-9 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
              <Globe className="w-4 h-4 text-dark-anchor" />
            </div>
          }
          title="Localization & Currency"
          subtitle="Regional formats and currency display"
        >
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-800/10 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Base Currency
                </span>
                <span className="font-bold text-sm text-[#111111]">
                  Philippine Peso (PHP)
                </span>
              </div>
              <span className="text-xl font-mono font-black text-dark-forest px-3 py-1 bg-[#DAE097]/40 rounded-xl border border-stone-800/15 shadow-[1px_1px_0px_0px_#111111]">
                ₱
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-800/10 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Locale Format
                </span>
                <span className="font-bold text-sm text-[#111111]">
                  en-PH (Philippines)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                ₱1,250.00
              </span>
            </div>

            <div className="p-3 bg-[#FFED9E]/25 rounded-2xl border border-stone-800/15 flex items-start gap-2.5 text-xs text-stone-800">
              <Coins className="w-4 h-4 text-dark-forest flex-shrink-0 mt-0.5" />
              <span>
                All account ledgers and transaction computations are locked to standard Philippine
                Peso (PHP, ₱) with 2-decimal offline accuracy.
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Bento 2: Privacy & Security */}
        <BentoCard
          variant="oat"
          sticker={
            <div className="w-9 h-9 rounded-2xl bg-[#F2C0CA] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
              <Shield className="w-4 h-4 text-dark-anchor" />
            </div>
          }
          title="Privacy & PIN Security"
          subtitle="Client-side PBKDF2 vault protection"
          action={getPinStatusBadge()}
        >
          <div className="space-y-4 pt-2">
            {/* PIN Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {!security.isPinSet ? (
                <Button
                  variant="forest"
                  size="sm"
                  data-testid="set-pin-btn"
                  icon={<Lock className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setPinModalMode('set');
                    setIsPinModalOpen(true);
                  }}
                >
                  Set Security PIN
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    data-testid="change-pin-btn"
                    icon={<Lock className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setPinModalMode('change');
                      setIsPinModalOpen(true);
                    }}
                  >
                    Change PIN
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="disable-pin-btn"
                    className="text-rose-700 hover:bg-rose-50 border border-rose-200"
                    onClick={() => {
                      setPinModalMode('remove');
                      setIsPinModalOpen(true);
                    }}
                  >
                    Disable PIN
                  </Button>
                  <Button
                    variant="blossom"
                    size="sm"
                    data-testid="lock-vault-btn"
                    icon={<Lock className="w-3.5 h-3.5 text-rose-800" />}
                    onClick={() => security.lock()}
                  >
                    Lock Vault Now
                  </Button>
                </>
              )}
            </div>

            {/* Auto-Lock Inactivity Dropdown */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-800/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <div>
                  <label
                    htmlFor="autolock-select"
                    className="block text-xs font-bold text-stone-800"
                  >
                    Auto-Lock Timeout
                  </label>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Locks vault after period of inactivity
                  </p>
                </div>
              </div>

              <select
                id="autolock-select"
                data-testid="autolock-select"
                value={security.autoLockMinutes}
                onChange={(e) => security.setAutoLockMinutes(Number(e.target.value))}
                className="select-custom-chevron px-3 py-1.5 bg-white rounded-xl border-2 border-[#111111] text-xs font-bold text-stone-800 shadow-[2px_2px_0px_0px_#111111] focus:outline-none focus:ring-2 focus:ring-[#124224]"
              >
                <option value="0">Off (Never)</option>
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
        </BentoCard>

        {/* Bento 3: Backup & Portability */}
        <BentoCard
          variant="oat"
          sticker={
            <div className="w-9 h-9 rounded-2xl bg-[#A6CFF2] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
              <Download className="w-4 h-4 text-dark-anchor" />
            </div>
          }
          title="Backup & Portability"
          subtitle="Full vault JSON snapshots and bank CSV statements"
        >
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full JSON Export */}
              <Button
                variant="primary"
                size="md"
                data-testid="export-backup-btn"
                isLoading={isExporting}
                icon={<Download className="w-4 h-4" />}
                onClick={handleExportBackup}
                fullWidth
              >
                Export Full JSON Backup
              </Button>

              {/* Restore JSON Backup */}
              <Button
                variant="outline"
                size="md"
                data-testid="open-restore-modal-btn"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => setIsBackupModalOpen(true)}
                fullWidth
              >
                Restore from JSON Backup
              </Button>
            </div>

            {/* Import Statement (CSV) */}
            <Button
              variant="pistachio"
              size="md"
              data-testid="open-csv-modal-btn"
              icon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => setIsCsvModalOpen(true)}
              fullWidth
            >
              Import Statement (CSV)
            </Button>

            {/* Export Notification */}
            {exportFeedback && (
              <p className="text-xs font-bold text-dark-forest bg-[#DAE097]/40 p-2.5 rounded-xl border border-stone-800/15">
                {exportFeedback}
              </p>
            )}
          </div>
        </BentoCard>

        {/* Bento 4: Data Management & Demo Mode */}
        <BentoCard
          variant="oat"
          sticker={
            <div className="w-9 h-9 rounded-2xl bg-[#DAE097] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
              <Sparkles className="w-4 h-4 text-dark-anchor" />
            </div>
          }
          title="Data Management & Demo"
          subtitle="Load sample Philippine transactions or wipe database"
        >
          <div className="space-y-4 pt-2">
            {/* Feedback Banners */}
            {demoLoadedBanner && (
              <div
                data-testid="demo-loaded-banner"
                className="p-3 bg-[#DAE097]/40 border-2 border-[#111111] rounded-2xl shadow-[2px_2px_0px_0px_#111111] flex items-center gap-2 text-xs font-bold text-dark-forest"
              >
                <CheckCircle2 className="w-4 h-4 text-dark-forest flex-shrink-0" />
                <span>18 realistic Philippine sample transactions loaded successfully!</span>
              </div>
            )}

            {resetSuccessBanner && (
              <div
                data-testid="reset-success-banner"
                className="p-3 bg-stone-100 border-2 border-[#111111] rounded-2xl shadow-[2px_2px_0px_0px_#111111] flex items-center gap-2 text-xs font-bold text-stone-800"
              >
                <CheckCircle2 className="w-4 h-4 text-stone-700 flex-shrink-0" />
                <span>Vault reset complete. Database is clean and ready for fresh setup.</span>
              </div>
            )}

            {/* 1. Load Sample Demo Data Button & Prompt */}
            {!showDemoConfirm ? (
              <div className="flex items-center justify-between gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-800/10">
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">
                    Sample Philippine Demo Data
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Seeds starter GCash, Maya, BPI accounts and 18 realistic transactions.
                  </p>
                </div>
                <Button
                  variant="butter"
                  size="sm"
                  data-testid="load-demo-btn"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => setShowDemoConfirm(true)}
                >
                  Load Sample Demo Data
                </Button>
              </div>
            ) : (
              <div
                data-testid="confirm-load-demo-prompt"
                className="p-4 bg-[#FFED9E]/40 border-2 border-[#111111] rounded-2xl shadow-[2px_2px_0px_0px_#111111] space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Load realistic Philippine demo data into your vault?</span>
                </div>
                <p className="text-[11px] text-stone-700">
                  This will add sample starter accounts, categories, and 18 past transactions.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="cancel-load-demo-btn"
                    onClick={() => setShowDemoConfirm(false)}
                    disabled={isLoadingDemo}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="forest"
                    size="sm"
                    data-testid="confirm-load-demo-btn"
                    isLoading={isLoadingDemo}
                    onClick={handleConfirmLoadDemo}
                  >
                    Confirm Load
                  </Button>
                </div>
              </div>
            )}

            {/* 2. Reset Entire Vault Button & Double Confirmation Prompt */}
            {resetStep === 0 && (
              <div className="flex items-center justify-between gap-2 p-3 bg-rose-50/50 rounded-2xl border border-rose-200">
                <div>
                  <h4 className="text-xs font-bold text-rose-900">
                    Reset Entire Vault
                  </h4>
                  <p className="text-[11px] text-rose-700/80">
                    Permanently wipes all local accounts, transactions, and preferences.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="reset-vault-btn"
                  className="bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-bold"
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-700" />}
                  onClick={() => setResetStep(1)}
                >
                  Reset Entire Vault
                </Button>
              </div>
            )}

            {resetStep === 1 && (
              <div
                data-testid="reset-step1-prompt"
                className="p-4 bg-[#F2C0CA]/30 border-2 border-[#111111] rounded-2xl shadow-[2px_2px_0px_0px_#111111] space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>Are you sure you want to reset your vault?</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  All accounts, transactions, and categories will be permanently deleted from this device.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetStep(0)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="blossom"
                    size="sm"
                    data-testid="confirm-reset-step1-btn"
                    onClick={() => setResetStep(2)}
                  >
                    Continue Reset
                  </Button>
                </div>
              </div>
            )}

            {resetStep === 2 && (
              <div
                data-testid="reset-step2-prompt"
                className="p-4 bg-rose-100 border-2 border-rose-800 rounded-2xl shadow-[3px_3px_0px_0px_#991b1b] space-y-2.5 animate-pulse"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-800 flex-shrink-0" />
                  <span>Final Warning: This action cannot be undone!</span>
                </div>
                <p className="text-[11px] text-rose-900 font-medium">
                  Please confirm that you want to wipe all local data and reset onboarding.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetStep(0)}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-rose-800 hover:bg-rose-900 text-white border-2 border-rose-950 shadow-none"
                    data-testid="confirm-reset-final-btn"
                    isLoading={isResetting}
                    onClick={handleConfirmResetFinal}
                  >
                    Permanently Reset Vault
                  </Button>
                </div>
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      {/* Backup Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onSuccess={() => {
          if (onDataLoaded) onDataLoaded();
        }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          if (onDataLoaded) onDataLoaded();
        }}
      />

      {/* PIN Settings Modal */}
      <PinSettingsModal
        isOpen={isPinModalOpen}
        mode={pinModalMode}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};
