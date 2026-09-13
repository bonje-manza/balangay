import React, { useState, useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallPromptProps {
  className?: string;
  forceShow?: boolean;
  onInstall?: () => void;
  onDismiss?: () => void;
}

const STORAGE_KEY = 'balangay_install_dismissed';

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  className = '',
  forceShow = false,
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    return !isDismissed && forceShow;
  });

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {
        // ignore user choice error
      }
      setDeferredPrompt(null);
    }
    setIsVisible(false);
    onInstall?.();
  }, [deferredPrompt, onInstall]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      data-testid="pwa-install-banner"
      className={`w-full bg-[#FFFDF9] border-b border-stone-800/15 px-4 py-3 shadow-sm ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Banner Left Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-butter border border-stone-800/20 flex items-center justify-center shadow-sm flex-shrink-0">
            <Download size={18} className="text-dark-anchor stroke-[2.2]" />
          </div>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold text-dark-anchor leading-tight">
              Install Balangay locally on your device for instant 100% offline access
            </p>
            <p className="text-[11px] font-medium text-dark-forest hidden sm:block">
              Fast loading, standalone window, and zero cloud dependencies.
            </p>
          </div>
        </div>

        {/* Banner Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#FFED9E] hover:bg-[#FFE57A] border border-stone-800/20 text-xs font-bold text-dark-anchor shadow-sm active:translate-y-0.5 transition-all cursor-pointer select-none touch-manipulation"
          >
            <Download className="w-3.5 h-3.5 text-dark-anchor stroke-[2.5]" />
            <span>Install App</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl hover:bg-stone-200/60 border border-transparent hover:border-dark-anchor/20 text-stone-600 hover:text-dark-anchor transition-all cursor-pointer flex items-center justify-center touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
