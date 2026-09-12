import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetDatabase } from '../storage/db';
import {
  exportFullDatabaseJSON,
  importFullDatabaseJSON,
  type BackupEnvelope,
} from './backupService';
import type { Account, Transaction, Category } from '../domain/types';

describe('backupService: JSON Export & Restore', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const sampleAccount: Account = {
    id: 'acc-1',
    name: 'GCash',
    type: 'ewallet',
    initialBalance: 5000,
    currency: 'PHP',
    color: '#A6CFF2',
    icon: 'Smartphone',
    isArchived: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const sampleCategory: Category = {
    id: 'cat-1',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#FFED9E',
    budgetLimit: 8000,
    isDefault: true,
  };

  const sampleTransaction: Transaction = {
    id: 'tx-1',
    amount: 250,
    type: 'expense',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    date: '2026-09-10',
    notes: 'Jollibee lunch',
    tags: ['fastfood', 'treat'],
    mood: 'Treat',
    createdAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z',
  };

  const sampleSetting = {
    key: 'user_settings',
    value: { currencyCode: 'PHP', pinEnabled: false },
  };

  describe('exportFullDatabaseJSON', () => {
    it('exports an empty database envelope with version 1 and appName', async () => {
      const json = await exportFullDatabaseJSON();
      expect(typeof json).toBe('string');

      const parsed: BackupEnvelope = JSON.parse(json);
      expect(parsed.version).toBe(1);
      expect(parsed.appName).toBe('Balangay Finance Tracker');
      expect(new Date(parsed.exportedAt).getTime()).not.toBeNaN();
      expect(parsed.data).toEqual({
        accounts: [],
        transactions: [],
        categories: [],
        settings: [],
      });
    });

    it('exports all database tables with complete entity fields', async () => {
      await db.accounts.add(sampleAccount);
      await db.categories.add(sampleCategory);
      await db.transactions.add(sampleTransaction);
      await db.settings.add(sampleSetting);

      const json = await exportFullDatabaseJSON();
      const parsed: BackupEnvelope = JSON.parse(json);

      expect(parsed.version).toBe(1);
      expect(parsed.appName).toBe('Balangay Finance Tracker');
      expect(parsed.data.accounts).toHaveLength(1);
      expect(parsed.data.accounts[0]).toEqual(sampleAccount);
      expect(parsed.data.categories).toHaveLength(1);
      expect(parsed.data.categories[0]).toEqual(sampleCategory);
      expect(parsed.data.transactions).toHaveLength(1);
      expect(parsed.data.transactions[0]).toEqual(sampleTransaction);
      expect(parsed.data.settings).toHaveLength(1);
      expect(parsed.data.settings[0]).toEqual(sampleSetting);
    });

    it('produces pretty-printed formatted JSON', async () => {
      const json = await exportFullDatabaseJSON();
      expect(json).toContain('\n');
      expect(json).toContain('  "version": 1');
    });
  });

  describe('importFullDatabaseJSON', () => {
    it('successfully restores accounts, transactions, categories, and settings', async () => {
      const envelope: BackupEnvelope = {
        version: 1,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: {
          accounts: [sampleAccount],
          categories: [sampleCategory],
          transactions: [sampleTransaction],
          settings: [sampleSetting],
        },
      };

      const result = await importFullDatabaseJSON(JSON.stringify(envelope));

      expect(result.success).toBe(true);
      expect(result.summary).toEqual({
        accounts: 1,
        transactions: 1,
        categories: 1,
        settings: 1,
      });

      expect(await db.accounts.count()).toBe(1);
      expect(await db.accounts.get('acc-1')).toEqual(sampleAccount);
      expect(await db.categories.get('cat-1')).toEqual(sampleCategory);
      expect(await db.transactions.get('tx-1')).toEqual(sampleTransaction);
      expect(await db.settings.get('user_settings')).toEqual(sampleSetting);
    });

    it('atomically wipes existing database records before restoring new data', async () => {
      // Seed existing data
      await db.accounts.add({
        ...sampleAccount,
        id: 'acc-old',
        name: 'Old Account',
      });
      expect(await db.accounts.count()).toBe(1);

      const envelope: BackupEnvelope = {
        version: 1,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: {
          accounts: [sampleAccount],
          categories: [],
          transactions: [],
          settings: [],
        },
      };

      await importFullDatabaseJSON(JSON.stringify(envelope));

      const allAccounts = await db.accounts.toArray();
      expect(allAccounts).toHaveLength(1);
      expect(allAccounts[0].id).toBe('acc-1');
      expect(await db.accounts.get('acc-old')).toBeUndefined();
    });

    it('performs roundtrip export and restore accurately', async () => {
      await db.accounts.add(sampleAccount);
      await db.categories.add(sampleCategory);
      await db.transactions.add(sampleTransaction);
      await db.settings.add(sampleSetting);

      const exported = await exportFullDatabaseJSON();
      await resetDatabase();
      expect(await db.accounts.count()).toBe(0);

      const importResult = await importFullDatabaseJSON(exported);
      expect(importResult.success).toBe(true);
      expect(importResult.summary.accounts).toBe(1);
      expect(importResult.summary.transactions).toBe(1);
      expect(importResult.summary.categories).toBe(1);
      expect(importResult.summary.settings).toBe(1);

      expect(await db.accounts.get(sampleAccount.id)).toEqual(sampleAccount);
      expect(await db.transactions.get(sampleTransaction.id)).toEqual(sampleTransaction);
    });

    it('rejects invalid JSON syntax and preserves existing data', async () => {
      await db.accounts.add(sampleAccount);

      await expect(importFullDatabaseJSON('{ invalid json ...')).rejects.toThrow(
        /invalid json/i
      );

      // Existing data must NOT be wiped
      expect(await db.accounts.count()).toBe(1);
      expect(await db.accounts.get(sampleAccount.id)).toBeDefined();
    });

    it('rejects backup with unsupported version and preserves existing data', async () => {
      await db.accounts.add(sampleAccount);

      const invalidVersion = JSON.stringify({
        version: 99,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: { accounts: [], transactions: [], categories: [], settings: [] },
      });

      await expect(importFullDatabaseJSON(invalidVersion)).rejects.toThrow(
        /unsupported.*version/i
      );

      expect(await db.accounts.count()).toBe(1);
    });

    it('rejects backup with missing version or appName', async () => {
      const missingVersion = JSON.stringify({
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: { accounts: [], transactions: [], categories: [], settings: [] },
      });

      await expect(importFullDatabaseJSON(missingVersion)).rejects.toThrow(
        /version/i
      );

      const invalidApp = JSON.stringify({
        version: 1,
        appName: 'SomeOtherApp',
        exportedAt: new Date().toISOString(),
        data: { accounts: [], transactions: [], categories: [], settings: [] },
      });

      await expect(importFullDatabaseJSON(invalidApp)).rejects.toThrow(
        /application|app/i
      );
    });

    it('rejects backup with missing required data tables and preserves data', async () => {
      await db.accounts.add(sampleAccount);

      const missingTables = JSON.stringify({
        version: 1,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: {
          accounts: [sampleAccount],
          // missing transactions, categories, settings
        },
      });

      await expect(importFullDatabaseJSON(missingTables)).rejects.toThrow(
        /schema|missing|data/i
      );

      // Existing data preserved
      expect(await db.accounts.count()).toBe(1);
    });

    it('rejects backup if data field is missing or not an object', async () => {
      const noData = JSON.stringify({
        version: 1,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
      });

      await expect(importFullDatabaseJSON(noData)).rejects.toThrow(
        /schema|missing|data/i
      );
    });

    it('rolls back completely if an error occurs during bulkAdd, leaving existing data intact', async () => {
      await db.accounts.add(sampleAccount);
      expect(await db.accounts.count()).toBe(1);

      // Payload with duplicate IDs in accounts array will throw ConstraintError in bulkAdd
      const duplicateAccountsPayload = JSON.stringify({
        version: 1,
        appName: 'Balangay Finance Tracker',
        exportedAt: new Date().toISOString(),
        data: {
          accounts: [sampleAccount, sampleAccount], // Duplicate primary key
          categories: [],
          transactions: [],
          settings: [],
        },
      });

      await expect(importFullDatabaseJSON(duplicateAccountsPayload)).rejects.toThrow();

      // Transaction rollback must leave previous account intact
      expect(await db.accounts.count()).toBe(1);
      expect(await db.accounts.get(sampleAccount.id)).toEqual(sampleAccount);
    });
  });
});
