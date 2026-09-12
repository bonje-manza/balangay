import { db } from './db';
import type { Transaction, TransactionType } from '../domain/types';

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

export interface CreateTransferParams {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  notes?: string;
  mood?: string;
}

/**
 * Retrieves transactions matching optional filter criteria, sorted by date descending.
 */
export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  let collection = db.transactions.toCollection();

  if (!filter) {
    const list = await collection.toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  const list = await db.transactions
    .filter((tx) => {
      if (filter.accountId && tx.accountId !== filter.accountId && tx.toAccountId !== filter.accountId) {
        return false;
      }
      if (filter.categoryId && tx.categoryId !== filter.categoryId) {
        return false;
      }
      if (filter.type && tx.type !== filter.type) {
        return false;
      }
      if (filter.startDate && tx.date < filter.startDate) {
        return false;
      }
      if (filter.endDate && tx.date > filter.endDate) {
        return false;
      }
      return true;
    })
    .toArray();

  return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/**
 * Creates and persists a single transaction.
 */
export async function createTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Transaction> {
  const now = new Date().toISOString();
  const id =
    tx.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const newTx: Transaction = {
    ...tx,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await db.transactions.add(newTx);
  return newTx;
}

/**
 * Atomically creates a transfer transaction between two accounts.
 */
export async function createTransfer(data: CreateTransferParams): Promise<Transaction> {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const transferTx: Transaction = {
    id,
    amount: data.amount,
    type: 'transfer',
    accountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    date: data.date,
    notes: data.notes,
    mood: data.mood,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', [db.transactions], async () => {
    await db.transactions.add(transferTx);
  });

  return transferTx;
}

/**
 * Updates an existing transaction by ID.
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  await db.transactions.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a transaction by ID.
 */
export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}
