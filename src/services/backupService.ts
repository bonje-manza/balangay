import { db, type SettingRecord } from '../storage/db';
import type { Account, Transaction, Category } from '../domain/types';

export const BACKUP_APP_NAME = 'Balangay Finance Tracker';
export const BACKUP_VERSION = 1;

export interface BackupEnvelope {
  version: number;
  appName: 'Balangay Finance Tracker';
  exportedAt: string;
  data: {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    settings: SettingRecord[];
  };
}

export interface ImportBackupResult {
  success: boolean;
  summary: {
    accounts: number;
    transactions: number;
    categories: number;
    settings: number;
  };
}

/**
 * Exports the entire IndexedDB database state into a versioned JSON backup envelope.
 *
 * @returns Pretty-printed JSON string containing accounts, transactions, categories, and settings.
 */
export async function exportFullDatabaseJSON(): Promise<string> {
  const [accounts, transactions, categories, settings] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.settings.toArray(),
  ]);

  const envelope: BackupEnvelope = {
    version: BACKUP_VERSION,
    appName: BACKUP_APP_NAME,
    exportedAt: new Date().toISOString(),
    data: {
      accounts,
      transactions,
      categories,
      settings,
    },
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Validates and restores a full database backup snapshot from a JSON string.
 * Execution is atomic: all existing records are wiped and replaced in a single Dexie transaction.
 * If validation fails or any error occurs, changes are rolled back automatically.
 *
 * @param jsonString - Raw JSON backup string.
 * @returns Summary of restored entity counts.
 */
export async function importFullDatabaseJSON(jsonString: string): Promise<ImportBackupResult> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format: Unable to parse backup payload');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup format: Expected a JSON object');
  }

  if (typeof parsed.version !== 'number' || parsed.version !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version: ${parsed.version ?? 'missing'}. Expected version ${BACKUP_VERSION}`
    );
  }

  if (parsed.appName !== BACKUP_APP_NAME) {
    throw new Error(
      `Invalid backup: unrecognized application '${parsed.appName ?? 'missing'}'. Expected '${BACKUP_APP_NAME}'`
    );
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Invalid backup schema: missing required data object');
  }

  const { accounts, transactions, categories, settings } = parsed.data;

  if (
    !Array.isArray(accounts) ||
    !Array.isArray(transactions) ||
    !Array.isArray(categories) ||
    !Array.isArray(settings)
  ) {
    throw new Error('Invalid backup schema: missing or malformed tables in data');
  }

  // Atomically wipe and restore within a Dexie transaction
  await db.transaction('rw', [db.accounts, db.transactions, db.categories, db.settings], async () => {
    await db.accounts.clear();
    await db.transactions.clear();
    await db.categories.clear();
    await db.settings.clear();

    if (accounts.length > 0) {
      await db.accounts.bulkAdd(accounts);
    }
    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
    }
    if (categories.length > 0) {
      await db.categories.bulkAdd(categories);
    }
    if (settings.length > 0) {
      await db.settings.bulkAdd(settings);
    }
  });

  return {
    success: true,
    summary: {
      accounts: accounts.length,
      transactions: transactions.length,
      categories: categories.length,
      settings: settings.length,
    },
  };
}
