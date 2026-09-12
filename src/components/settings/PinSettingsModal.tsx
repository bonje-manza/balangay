import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSecurity } from '../../context/SecurityContext';

export type PinModalMode = 'set' | 'change' | 'remove';

export interface PinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: PinModalMode;
  onSuccess?: () => void;
}

/**
 * PinSettingsModal: Modal to configure, change, or remove the local vault PIN.
 * Validates 4-6 digit numeric pin formats, checks confirmation match, and updates SecurityContext.
 */
export const PinSettingsModal: React.FC<PinSettingsModalProps> = ({
  isOpen,
  onClose,
  mode: propMode,
  onSuccess,
}) => {
  const security = useSecurity();
  const isPinConfigured = security?.isPinSet ?? false;

  const getInitialMode = (): PinModalMode => {
    if (propMode) return propMode;
    return isPinConfigured ? 'change' : 'set';
  };

  const [currentMode, setCurrentMode] = useState<PinModalMode>(getInitialMode);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (propMode) {
      setCurrentMode(propMode);
    } else {
      setCurrentMode(isPinConfigured ? 'change' : 'set');
    }
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [propMode, isPinConfigured, isOpen]);

  const handleClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const isValidPinFormat = (pin: string): boolean => {
    return /^\d{4,6}$/.test(pin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentMode === 'set') {
      if (!isValidPinFormat(newPin)) {
        setErrorMessage('PIN must be 4 to 6 digits (numbers only).');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMessage('PINs do not match. Please verify your confirmation.');
        return;
      }

      try {
        setIsSubmitting(true);
        await security.setPin(newPin);
        if (onSuccess) onSuccess();
        handleClose();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to set PIN.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentMode === 'remove') {
      if (!currentPin) {
        setErrorMessage('Please enter your current PIN.');
        return;
      }

      try {
        setIsSubmitting(true);
        const valid = await security.removePin(currentPin);
        if (!valid) {
          setErrorMessage('Incorrect current PIN. Please try again.');
          return;
        }

        if (onSuccess) onSuccess();
        handleClose();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to remove PIN.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentMode === 'change') {
      if (!currentPin) {
        setErrorMessage('Please enter your current PIN.');
        return;
      }
      if (!isValidPinFormat(newPin)) {
        setErrorMessage('New PIN must be 4 to 6 digits (numbers only).');
        return;
      }
      if (newPin !== confirmPin) {
        setErrorMessage('PINs do not match. Please verify your confirmation.');
        return;
      }

      try {
        setIsSubmitting(true);
        const valid = await security.removePin(currentPin);
        if (!valid) {
          setErrorMessage('Incorrect current PIN. Please try again.');
          return;
        }

        await security.setPin(newPin);
        if (onSuccess) onSuccess();
        handleClose();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to update PIN.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getTitle = (): string => {
    switch (currentMode) {
      case 'set':
        return 'Set Security PIN';
      case 'change':
        return 'Change Security PIN';
      case 'remove':
        return 'Disable PIN Protection';
    }
  };

  const getSubtitle = (): string => {
    switch (currentMode) {
      case 'set':
        return 'Create a 4 to 6 digit PIN to protect your local vault';
      case 'change':
        return 'Update your current security PIN';
      case 'remove':
        return 'Remove PIN requirement when opening your vault';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode switcher tabs if PIN is configured and no strict mode was passed */}
        {!propMode && isPinConfigured && (
          <div className="flex rounded-2xl bg-stone-100 p-1 border-2 border-[#111111] shadow-[2px_2px_0px_0px_#111111]">
            <button
              type="button"
              onClick={() => {
                setCurrentMode('change');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentMode === 'change'
                  ? 'bg-white text-[#111111] shadow-[1px_1px_0px_0px_#111111]'
                  : 'text-stone-600 hover:text-[#111111]'
              }`}
            >
              Change PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMode('remove');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currentMode === 'remove'
                  ? 'bg-white text-rose-700 shadow-[1px_1px_0px_0px_#111111]'
                  : 'text-stone-600 hover:text-rose-700'
              }`}
            >
              Disable PIN
            </button>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div
            data-testid="pin-error-message"
            className="p-3 bg-[#F2C0CA]/30 border-2 border-[#111111] rounded-2xl flex items-start gap-2.5 text-xs font-bold text-rose-900 shadow-[2px_2px_0px_0px_#111111]"
          >
            <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Current PIN Input for Change or Remove */}
        {(currentMode === 'remove' || currentMode === 'change') && (
          <div>
            <label
              htmlFor="current-pin-input"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
            >
              Current PIN *
            </label>
            <div className="relative">
              <input
                id="current-pin-input"
                type="password"
                maxLength={6}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                data-testid="current-pin-input"
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border-2 border-[#111111] text-lg font-mono font-bold text-[#111111] placeholder:text-stone-400 shadow-[2px_2px_0px_0px_#111111] focus:outline-none focus:ring-2 focus:ring-[#124224] tracking-widest"
              />
            </div>
          </div>
        )}

        {/* New PIN & Confirm PIN for Set or Change */}
        {(currentMode === 'set' || currentMode === 'change') && (
          <>
            <div>
              <label
                htmlFor="new-pin-input"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                {currentMode === 'change' ? 'New PIN (4-6 digits) *' : 'PIN (4-6 digits) *'}
              </label>
              <input
                id="new-pin-input"
                type="password"
                maxLength={6}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                data-testid="new-pin-input"
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border-2 border-[#111111] text-lg font-mono font-bold text-[#111111] placeholder:text-stone-400 shadow-[2px_2px_0px_0px_#111111] focus:outline-none focus:ring-2 focus:ring-[#124224] tracking-widest"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-pin-input"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1"
              >
                Confirm PIN *
              </label>
              <input
                id="confirm-pin-input"
                type="password"
                maxLength={6}
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                data-testid="confirm-pin-input"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border-2 border-[#111111] text-lg font-mono font-bold text-[#111111] placeholder:text-stone-400 shadow-[2px_2px_0px_0px_#111111] focus:outline-none focus:ring-2 focus:ring-[#124224] tracking-widest"
              />
            </div>
          </>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-stone-800/10 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            data-testid="pin-cancel-btn"
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {currentMode === 'set' && (
            <Button
              type="submit"
              variant="forest"
              size="sm"
              isLoading={isSubmitting}
              icon={<Lock className="w-3.5 h-3.5" />}
              data-testid="pin-submit-btn"
            >
              Set PIN
            </Button>
          )}

          {currentMode === 'change' && (
            <Button
              type="submit"
              variant="forest"
              size="sm"
              isLoading={isSubmitting}
              icon={<KeyRound className="w-3.5 h-3.5" />}
              data-testid="pin-change-btn"
            >
              Update PIN
            </Button>
          )}

          {currentMode === 'remove' && (
            <Button
              type="submit"
              variant="blossom"
              size="sm"
              isLoading={isSubmitting}
              icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-800" />}
              data-testid="pin-remove-btn"
            >
              Disable PIN
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
