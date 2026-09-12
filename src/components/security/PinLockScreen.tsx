import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Wallet, Delete } from 'lucide-react';
import { SecurityContext } from '../../context/SecurityContext';
import { Modal } from '../ui/Modal';
import { importFullDatabaseJSON } from '../../services/backupService';
import { saveUserSettings } from '../../storage/settingsRepository';

export interface PinLockScreenProps {
  pinLength?: number;
  onSuccess?: () => void;
  onEmergencyRestore?: () => void;
  unlock?: (pin: string) => Promise<boolean>;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * PinLockScreen: Full-screen Soft Neo-brutalism lock overlay with Oat Milk backdrop,
 * Balangay branding, animated PIN dot indicators, and tactile 3x4 numeric keypad.
 */
export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  pinLength = 4,
  onSuccess,
  onEmergencyRestore,
  unlock,
  title = 'Enter PIN to Unlock',
  subtitle = 'Balangay Offline Vault',
  className = '',
}) => {
  const security = useContext(SecurityContext);
  const unlockFn = unlock ?? security?.unlock;

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showEmergencyRestore, setShowEmergencyRestore] = useState<boolean>(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);

  const handleEmergencyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringBackup(true);
    setEmergencyError(null);

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

      await importFullDatabaseJSON(text);
      await saveUserSettings({
        pinEnabled: false,
        pinHash: undefined,
      });

      if (security?.reloadSecurity) {
        await security.reloadSecurity();
      }

      setShowEmergencyRestore(false);
      onEmergencyRestore?.();
      onSuccess?.();
    } catch (err: any) {
      setEmergencyError(err?.message || 'Invalid backup file. Could not restore.');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const verifyAttempt = useCallback(
    async (enteredPin: string) => {
      if (!unlockFn) {
        setError('Security service unavailable.');
        return;
      }

      setIsVerifying(true);
      try {
        const success = await unlockFn(enteredPin);
        if (success) {
          setError(null);
          onSuccess?.();
        } else {
          setError('Incorrect PIN. Please try again.');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 600);
        }
      } catch {
        setError('Failed to verify PIN. Please try again.');
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 600);
      } finally {
        setIsVerifying(false);
      }
    },
    [unlockFn, onSuccess]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isVerifying || isShaking || pin.length >= pinLength) return;
      setError(null);
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === pinLength) {
        verifyAttempt(nextPin);
      }
    },
    [pin, pinLength, isVerifying, isShaking, verifyAttempt]
  );

  const handleBackspace = useCallback(() => {
    if (isVerifying || isShaking || pin.length === 0) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isVerifying, isShaking, pin.length]);

  const handleClear = useCallback(() => {
    if (isVerifying || isShaking) return;
    setError(null);
    setPin('');
  }, [isVerifying, isShaking]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div
      data-testid="pin-lock-screen"
      className={`fixed inset-0 z-50 bg-[#F7F2E8] flex flex-col items-center justify-center p-4 select-none min-h-screen ${className}`}
    >
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Balangay Logo */}
        <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center shadow-sm mb-3">
          <Wallet className="w-7 h-7 text-[#111111]" />
        </div>

        {/* Serif Heading */}
        <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-[#111111] text-center">
          {title}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1 mb-6 text-center">
          {subtitle}
        </p>

        {/* PIN Dot Indicators */}
        <div
          data-testid="pin-dots-container"
          className={`flex items-center justify-center gap-4 my-2 transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: pinLength }).map((_, i) => {
            const isFilled = i < pin.length;
            const isErrorState = Boolean(error) && isShaking;

            let dotColor = 'border-2 border-stone-800/30 bg-transparent';
            if (isErrorState) {
              dotColor = 'bg-[#9E2A3B] border-2 border-[#9E2A3B] scale-110';
            } else if (isFilled) {
              dotColor = 'bg-[#111111] border-2 border-[#111111] scale-110 shadow-sm';
            }

            return (
              <div
                key={i}
                data-testid={`pin-dot-${i}`}
                data-filled={isFilled ? 'true' : 'false'}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${dotColor}`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        <div className="min-h-[28px] my-2 flex items-center justify-center">
          {error ? (
            <p role="alert" className="text-xs sm:text-sm font-bold text-[#9E2A3B] text-center">
              {error}
            </p>
          ) : null}
        </div>

        {/* 3x4 Tactile Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          {/* Digits 1 to 9 */}
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              data-testid={`keypad-${digit}`}
              onClick={() => handleDigit(digit)}
              disabled={isVerifying}
              className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-stone-50 border border-stone-800/20 shadow-sm active:translate-y-0.5 font-mono text-xl sm:text-2xl font-bold text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
            >
              {digit}
            </button>
          ))}

          {/* Clear Key */}
          <button
            type="button"
            data-testid="keypad-clear"
            onClick={handleClear}
            disabled={isVerifying}
            className="h-14 sm:h-16 rounded-2xl bg-[#F2C0CA]/30 hover:bg-[#F2C0CA]/50 border border-stone-800/20 shadow-sm active:translate-y-0.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
          >
            Clear
          </button>

          {/* Digit 0 */}
          <button
            type="button"
            data-testid="keypad-0"
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-stone-50 border border-stone-800/20 shadow-sm active:translate-y-0.5 font-mono text-xl sm:text-2xl font-bold text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            data-testid="keypad-backspace"
            aria-label="Backspace"
            onClick={handleBackspace}
            disabled={isVerifying}
            className="h-14 sm:h-16 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-800/20 shadow-sm active:translate-y-0.5 text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Emergency Restore Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            data-testid="forgot-pin-btn"
            onClick={() => setShowEmergencyRestore(true)}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline underline-offset-4 cursor-pointer"
          >
            Forgot PIN? Restore from backup file
          </button>
        </div>
      </div>

      {/* Emergency Restore Modal */}
      <Modal
        isOpen={showEmergencyRestore}
        onClose={() => {
          setShowEmergencyRestore(false);
          setEmergencyError(null);
        }}
        title="Emergency Vault Restore"
        subtitle="Restore from a JSON backup to reset your PIN"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-[#FFED9E]/30 border border-amber-800/20 rounded-2xl text-xs text-stone-800 leading-relaxed shadow-sm">
            <p className="font-bold text-[#111111] mb-1">Locked out without a PIN?</p>
            Restoring a valid Balangay JSON backup file will restore your financial data and disable the forgotten PIN, granting immediate access to your vault.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Select Balangay Backup (.json)
            </label>
            <input
              type="file"
              accept=".json,application/json"
              data-testid="emergency-restore-input"
              disabled={isRestoringBackup}
              onChange={handleEmergencyFileSelect}
              className="block w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-2 file:border-[#111111] file:text-xs file:font-bold file:bg-[#FFED9E] hover:file:bg-[#ffe67c] file:cursor-pointer file:shadow-[1px_1px_0px_0px_#111111] border-2 border-[#111111] rounded-2xl p-2 bg-white"
            />
          </div>

          {emergencyError && (
            <p role="alert" className="text-xs font-bold text-rose-600">
              {emergencyError}
            </p>
          )}

          {isRestoringBackup && (
            <p className="text-xs font-medium text-stone-600 animate-pulse">
              Restoring vault data and resetting PIN...
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
