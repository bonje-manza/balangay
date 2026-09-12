import { db } from './db';
import type { UserSettings } from '../domain/types';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  currencyCode: 'PHP',
  currencySymbol: '₱',
  currencyLocale: 'en-PH',
  pinEnabled: false,
  autoLockMinutes: 0,
  hasCompletedOnboarding: false,
};

const SETTINGS_KEY = 'user_settings';

/**
 * Retrieves the current user settings, or returns defaults if none saved yet.
 */
export async function getUserSettings(): Promise<UserSettings> {
  const record = await db.settings.get(SETTINGS_KEY);
  if (!record || !record.value) {
    return { ...DEFAULT_USER_SETTINGS };
  }
  return {
    ...DEFAULT_USER_SETTINGS,
    ...record.value,
  };
}

/**
 * Merges and saves partial user settings into the database.
 */
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getUserSettings();
  const merged: UserSettings = {
    ...current,
    ...settings,
  };

  await db.settings.put({
    key: SETTINGS_KEY,
    value: merged,
  });
}
