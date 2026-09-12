import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Wallet, Delete } from 'lucide-react';
import { SecurityContext } from '../../context/SecurityContext';

export interface PinLockScreenProps {
  pinLength?: number;
  onSuccess?: () => void;
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
        <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0px_0px_#111111] mb-3">
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
            isShaking ? 'animate-bounce' : ''
          }`}
        >
          {Array.from({ length: pinLength }).map((_, i) => {
            const isFilled = i < pin.length;
            const isErrorState = Boolean(error) && isShaking;

            let dotColor = 'border-2 border-stone-800/30 bg-transparent';
            if (isErrorState) {
              dotColor = 'bg-[#9E2A3B] border-2 border-[#9E2A3B] scale-110';
            } else if (isFilled) {
              dotColor = 'bg-[#111111] border-2 border-[#111111] scale-110 shadow-[1px_1px_0px_0px_#111111]';
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

        {/* 3x4 Tactile Neo-Brutalist Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          {/* Digits 1 to 9 */}
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              data-testid={`keypad-${digit}`}
              onClick={() => handleDigit(digit)}
              disabled={isVerifying}
              className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-mono text-xl sm:text-2xl font-black text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
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
            className="h-14 sm:h-16 rounded-2xl bg-[#F2C0CA]/30 hover:bg-[#F2C0CA]/50 border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs sm:text-sm font-bold uppercase tracking-wider text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
          >
            Clear
          </button>

          {/* Digit 0 */}
          <button
            type="button"
            data-testid="keypad-0"
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-mono text-xl sm:text-2xl font-black text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
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
            className="h-14 sm:h-16 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-[#111111] flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
