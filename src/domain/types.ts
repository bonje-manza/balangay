export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string; // default 'PHP'
  color: string;
  icon: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  amount: number; // positive number
  type: TransactionType;
  accountId: string; // source account for expense/transfer, destination for income
  toAccountId?: string; // required if type === 'transfer'
  categoryId?: string; // required for expense/income, optional for transfer
  date: string; // YYYY-MM-DD or ISO
  notes?: string;
  tags?: string[];
  mood?: string; // e.g. "Peaceful", "Essential", "Treat", "Invest"
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  budgetLimit?: number; // monthly spending cap in PHP
  isDefault?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetProgress {
  categoryId: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  isWarning: boolean; // >= 80% and <= 100%
  isOverBudget: boolean; // > 100%
}

export interface CashflowSummary {
  income: number;
  expense: number;
  net: number;
}

export interface UserSettings {
  currencyCode: string; // 'PHP'
  currencySymbol: string; // '₱'
  currencyLocale: string; // 'en-PH'
  pinHash?: string;
  pinLength?: number;
  pinEnabled: boolean;
  autoLockMinutes: number; // 0 for disabled, or 1, 5, 15
  hasCompletedOnboarding: boolean;
}
