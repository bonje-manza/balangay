import { db } from './db';
import type { Account } from '../domain/types';

/**
 * Retrieves all accounts stored in the database.
 */
export async function getAccounts(): Promise<Account[]> {
  return await db.accounts.toArray();
}

/**
 * Retrieves a single account by its ID.
 */
export async function getAccountById(id: string): Promise<Account | undefined> {
  return await db.accounts.get(id);
}

/**
 * Creates and persists a new account.
 */
export async function createAccount(
  account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Account> {
  const now = new Date().toISOString();
  const id =
    account.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const newAccount: Account = {
    ...account,
    id,
    currency: account.currency || 'PHP',
    isArchived: account.isArchived ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await db.accounts.add(newAccount);
  return newAccount;
}

/**
 * Updates an existing account by ID.
 */
export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, 'id' | 'createdAt'>>
): Promise<void> {
  await db.accounts.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes an account and automatically cleans up any associated transactions
 * where this account was either the source or destination.
 */
export async function deleteAccount(id: string): Promise<void> {
  await db.transaction('rw', [db.accounts, db.transactions], async () => {
    const associatedTxs = await db.transactions
      .filter((tx) => tx.accountId === id || tx.toAccountId === id)
      .toArray();

    if (associatedTxs.length > 0) {
      await db.transactions.bulkDelete(associatedTxs.map((t) => t.id));
    }

    await db.accounts.delete(id);
  });
}
