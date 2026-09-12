import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ');

/**
 * Modal: Accessible dialog modal with soft neo-brutalist bento styling,
 * rounded-3xl corners, hairline crisp borders, and backdrop scrim.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleIdRef = useRef<string>(`modal-title-${Math.random().toString(36).substring(2, 9)}`);
  const titleId = titleIdRef.current;

  // Close on Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap and return focus on close
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const getFocusableElements = (): HTMLElement[] => {
      if (!modalElement) return [];
      return Array.from(modalElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    };

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      modalElement.focus();
    }

    const handleTrapKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !modalElement.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTrapKeyDown);

    return () => {
      window.removeEventListener('keydown', handleTrapKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title && typeof title === 'string' ? title : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Scrim - zero heavy blur */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-[#111111]/45 transition-opacity"
        onClick={() => {
          if (closeOnBackdropClick) {
            onClose();
          }
        }}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-10 w-full ${maxWidth} bg-[#FFFDF9] text-[#111111] rounded-3xl border border-stone-800/20 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h2
                id={titleId}
                className="font-serif font-bold text-xl sm:text-2xl text-[#111111] tracking-tight"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors active:translate-y-0.5 cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="text-sm text-stone-800 leading-relaxed">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-stone-800/10 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
