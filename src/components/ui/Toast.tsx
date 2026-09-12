import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export type ToastVariant = 'pistachio' | 'butter' | 'blossom' | 'dark';

export interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  variant?: ToastVariant;
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Toast: Transient post-action confirmation notification styled in Soft Neo-Brutalism.
 * Positioned safely above the bottom floating navigation dock.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  variant = 'pistachio',
  durationMs = 3500,
  action,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen || durationMs <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  const iconBg =
    variant === 'pistachio'
      ? 'bg-[#DAE097] text-[#124224]'
      : variant === 'butter'
      ? 'bg-[#FFED9E] text-[#111111]'
      : variant === 'blossom'
      ? 'bg-[#F2C0CA] text-[#9E2A3B]'
      : 'bg-stone-800 text-[#FFFDF9]';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast-notification"
      className={`fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md bg-[#111111] text-[#F7F2E8] border-2 border-[#111111] rounded-2xl px-4 py-2.5 shadow-[4px_4px_0px_0px_#124224] flex items-center justify-between gap-3 text-xs font-bold transition-all select-none ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
        <span className="truncate">{message}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <button
            type="button"
            data-testid="toast-action-btn"
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="px-2 py-1 rounded-lg bg-[#FFED9E] text-[#111111] hover:bg-[#FFF3B8] text-[11px] font-black border border-stone-800 transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        )}

        <button
          type="button"
          data-testid="toast-dismiss-btn"
          onClick={onClose}
          aria-label="Dismiss toast"
          className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
