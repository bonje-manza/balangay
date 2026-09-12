import Dexie, { type Table } from 'dexie';
import type { Account, Transaction, Category } from '../domain/types';

export interface SettingRecord {
  key: string;
  value: any;
}

export class FinanceTrackerDB extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('FinanceTrackerDB');

    this.version(1).stores({
      accounts: 'id, name, type, isArchived, createdAt',
      transactions: 'id, accountId, toAccountId, categoryId, type, date, createdAt',
      categories: 'id, name, type',
      settings: 'key',
    });
  }
}

export const db = new FinanceTrackerDB();

/**
 * Wipes all records from every table cleanly for testing or user resets.
 */
export async function resetDatabase(): Promise<void> {
  await Promise.all([
    db.accounts.clear(),
    db.transactions.clear(),
    db.categories.clear(),
    db.settings.clear(),
  ]);
}
