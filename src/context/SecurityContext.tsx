import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type FC,
} from 'react';
import { getUserSettings, saveUserSettings } from '../storage/settingsRepository';
import { hashPin, verifyPin } from '../services/securityService';

export interface SecurityContextValue {
  isLocked: boolean;
  isPinSet: boolean;
  autoLockMinutes: number;
  isLoading: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  removePin: (currentPin: string) => Promise<boolean>;
  lock: () => void;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
  reloadSecurity?: () => Promise<void>;
}

export const SecurityContext = createContext<SecurityContextValue | null>(null);

export interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: FC<SecurityProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(0);
  const pinHashRef = useRef<string | undefined>(undefined);

  // Load initial settings on mount
  useEffect(() => {
    let isSubscribed = true;

    async function loadSettings() {
      try {
        const settings = await getUserSettings();
        if (!isSubscribed) return;

        const pinConfigured = Boolean(
          settings.pinEnabled && settings.pinHash && settings.pinHash.trim().length > 0
        );

        pinHashRef.current = pinConfigured ? settings.pinHash : undefined;
        setIsPinSet(pinConfigured);
        setAutoLockMinutesState(settings.autoLockMinutes ?? 0);
        setIsLocked(pinConfigured);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!isPinSet) {
        return false;
      }

      let currentHash = pinHashRef.current;
      if (!currentHash) {
        const settings = await getUserSettings();
        if (settings.pinEnabled && settings.pinHash && settings.pinHash.trim().length > 0) {
          currentHash = settings.pinHash;
          pinHashRef.current = currentHash;
        }
      }

      if (!currentHash) {
        return false;
      }

      const isValid = await verifyPin(pin, currentHash);
      if (isValid) {
        setIsLocked(false);
        return true;
      }

      return false;
    },
    [isPinSet]
  );

  const setPin = useCallback(async (pin: string): Promise<void> => {
    const hashed = await hashPin(pin);
    await saveUserSettings({
      pinEnabled: true,
      pinHash: hashed,
    });

    pinHashRef.current = hashed;
    setIsPinSet(true);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(
    async (currentPin: string): Promise<boolean> => {
      if (!isPinSet) {
        return false;
      }

      let currentHash = pinHashRef.current;
      if (!currentHash) {
        const settings = await getUserSettings();
        if (settings.pinEnabled && settings.pinHash && settings.pinHash.trim().length > 0) {
          currentHash = settings.pinHash;
          pinHashRef.current = currentHash;
        }
      }

      if (!currentHash) {
        return false;
      }

      const isValid = await verifyPin(currentPin, currentHash);
      if (!isValid) {
        return false;
      }

      await saveUserSettings({
        pinEnabled: false,
        pinHash: undefined,
      });

      pinHashRef.current = undefined;
      setIsPinSet(false);
      setIsLocked(false);
      return true;
    },
    [isPinSet]
  );

  const lock = useCallback((): void => {
    setIsLocked(true);
  }, []);

  const setAutoLockMinutes = useCallback(async (minutes: number): Promise<void> => {
    const sanitized = Math.max(0, Math.floor(minutes) || 0);
    await saveUserSettings({
      autoLockMinutes: sanitized,
    });
    setAutoLockMinutesState(sanitized);
  }, []);

  const reloadSecurity = useCallback(async (): Promise<void> => {
    const settings = await getUserSettings();
    const pinConfigured = Boolean(
      settings.pinEnabled && settings.pinHash && settings.pinHash.trim().length > 0
    );
    pinHashRef.current = pinConfigured ? settings.pinHash : undefined;
    setIsPinSet(pinConfigured);
    setAutoLockMinutesState(settings.autoLockMinutes ?? 0);
    setIsLocked(pinConfigured);
  }, []);

  // Inactivity monitoring effect
  useEffect(() => {
    if (isLocked || !isPinSet || autoLockMinutes <= 0) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setIsLocked(true);
      }, autoLockMinutes * 60 * 1000);
    };

    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isLocked, isPinSet, autoLockMinutes]);

  const value: SecurityContextValue = useMemo(
    () => ({
      isLocked,
      isPinSet,
      autoLockMinutes,
      isLoading,
      unlock,
      setPin,
      removePin,
      lock,
      setAutoLockMinutes,
      reloadSecurity,
    }),
    [
      isLocked,
      isPinSet,
      autoLockMinutes,
      isLoading,
      unlock,
      setPin,
      removePin,
      lock,
      setAutoLockMinutes,
      reloadSecurity,
    ]
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export function useSecurity(): SecurityContextValue {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
