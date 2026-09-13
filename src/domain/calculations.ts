import type { Account, Transaction, BudgetProgress, CashflowSummary } from './types';
import { roundMoney } from './money';

/**
 * Checks if a transaction date string falls within a specific year and 1-indexed month.
 * Handles both YYYY-MM-DD prefixes and full ISO strings without timezone shift.
 */
function matchesYearMonth(dateStr: string, year: number, month: number): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return y === year && m === month;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return false;
  }
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

/**
 * Calculates current running balance for all accounts based on initial balance and transactions.
 * - Income adds to destination account.
 * - Expense subtracts from source account.
 * - Transfer deducts from source and credits destination account.
 * - Symmetrically handles credit accounts (where spending can lead to negative balances).
 *
 * @param accounts - Array of account definitions.
 * @param transactions - Complete ledger of transactions.
 * @returns Map of account ID to rounded current balance.
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Map<string, number> {
  const balances = new Map<string, number>();

  for (const account of accounts) {
    balances.set(account.id, roundMoney(account.initialBalance));
  }

  for (const tx of transactions) {
    const amount = roundMoney(tx.amount);

    if (tx.type === 'income') {
      if (balances.has(tx.accountId)) {
        const current = balances.get(tx.accountId)!;
        balances.set(tx.accountId, roundMoney(current + amount));
      }
    } else if (tx.type === 'expense') {
      if (balances.has(tx.accountId)) {
        const current = balances.get(tx.accountId)!;
        balances.set(tx.accountId, roundMoney(current - amount));
      }
    } else if (tx.type === 'transfer') {
      // Transfer where source equals destination produces net 0 change
      if (tx.accountId === tx.toAccountId) {
        continue;
      }
      if (balances.has(tx.accountId)) {
        const current = balances.get(tx.accountId)!;
        balances.set(tx.accountId, roundMoney(current - amount));
      }
      if (tx.toAccountId && balances.has(tx.toAccountId)) {
        const current = balances.get(tx.toAccountId)!;
        balances.set(tx.toAccountId, roundMoney(current + amount));
      }
    }
  }

  return balances;
}

/**
 * Calculates net worth by summing running balances of all accounts.
 *
 * @param accounts - Array of accounts.
 * @param transactions - Array of transactions.
 * @returns Total net worth rounded to 2 decimal places.
 */
export function calculateNetWorth(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const balances = calculateAccountBalances(accounts, transactions);
  let total = 0;
  for (const balance of balances.values()) {
    total += balance;
  }
  return roundMoney(total);
}

/**
 * Aggregates cashflow (total income, total expense, net) for a specified year and 1-indexed month.
 * Transfers between accounts do not count towards income or expenses.
 *
 * @param transactions - Array of transactions.
 * @param year - Calendar year (e.g. 2026).
 * @param month - Calendar month 1-12 (1 = Jan, 12 = Dec).
 * @returns CashflowSummary with rounded income, expense, and net values.
 */
export function calculateMonthlyCashflow(
  transactions: Transaction[],
  year: number,
  month: number
): CashflowSummary {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (!matchesYearMonth(tx.date, year, month)) {
      continue;
    }

    if (tx.type === 'income') {
      income += tx.amount;
    } else if (tx.type === 'expense') {
      expense += tx.amount;
    }
    // Transfers are excluded from income / expense cashflow
  }

  const roundedIncome = roundMoney(income);
  const roundedExpense = roundMoney(expense);
  const net = roundMoney(roundedIncome - roundedExpense);

  return {
    income: roundedIncome,
    expense: roundedExpense,
    net,
  };
}

/**
 * Calculates total expenses per category for a given month and year.
 * Non-expense transactions and transactions without categoryId are ignored.
 *
 * @param transactions - Array of transactions.
 * @param year - Calendar year (e.g. 2026).
 * @param month - Calendar month 1-12 (1 = Jan, 12 = Dec).
 * @returns Map of category ID to total spent amount.
 */
export function calculateCategorySpending(
  transactions: Transaction[],
  year: number,
  month: number
): Map<string, number> {
  const spending = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') {
      continue;
    }

    if (!tx.categoryId) {
      continue;
    }

    if (!matchesYearMonth(tx.date, year, month)) {
      continue;
    }

    const current = spending.get(tx.categoryId) ?? 0;
    spending.set(tx.categoryId, roundMoney(current + tx.amount));
  }

  return spending;
}

/**
 * Calculates budget progress, remaining limit, spending percentage, and warning/over-budget flags.
 *
 * @param budgetLimit - Monthly budget limit in PHP.
 * @param spentAmount - Amount spent so far in PHP.
 * @returns Object with limit, spent, remaining, percent, isWarning, and isOverBudget.
 */
export function calculateBudgetProgress(
  budgetLimit: number,
  spentAmount: number
): Omit<BudgetProgress, 'categoryId'> {
  const limit = roundMoney(budgetLimit);
  const spent = roundMoney(spentAmount);
  const percent = limit > 0 ? roundMoney((spent / limit) * 100) : 0;
  const remaining = roundMoney(limit - spent);
  const isWarning = percent >= 80 && percent <= 100;
  const isOverBudget = percent > 100;

  return {
    limit,
    spent,
    remaining,
    percent,
    isWarning,
    isOverBudget,
  };
}

/**
 * Normalizes a transaction date string to a 'YYYY-MM-DD' key.
 */
export function toDateKey(dateStr: string): string {
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Aggregates daily cashflow (income, expense, net) for each date in a given month and year.
 * Returns a Map where keys are 'YYYY-MM-DD' strings.
 * Transfers are excluded from income and expense.
 */
export function calculateDailyCashflow(
  transactions: Transaction[],
  year: number,
  month: number
): Map<string, CashflowSummary> {
  const daily = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    if (!matchesYearMonth(tx.date, year, month)) {
      continue;
    }
    if (tx.type !== 'income' && tx.type !== 'expense') {
      continue;
    }

    const key = toDateKey(tx.date);
    if (!key) continue;

    const current = daily.get(key) || { income: 0, expense: 0 };
    if (tx.type === 'income') {
      current.income += tx.amount;
    } else if (tx.type === 'expense') {
      current.expense += tx.amount;
    }
    daily.set(key, current);
  }

  const result = new Map<string, CashflowSummary>();
  for (const [key, val] of daily.entries()) {
    const income = roundMoney(val.income);
    const expense = roundMoney(val.expense);
    const net = roundMoney(income - expense);
    result.set(key, { income, expense, net });
  }

  return result;
}

export interface MonthlyCashflowItem extends CashflowSummary {
  month: number; // 1 to 12
}

export interface YearlyCashflowSummary {
  months: MonthlyCashflowItem[];
  total: CashflowSummary;
}

/**
 * Aggregates cashflow for each of the 12 months in a given calendar year.
 */
export function calculateYearlyCashflow(
  transactions: Transaction[],
  year: number
): YearlyCashflowSummary {
  const months: MonthlyCashflowItem[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (let m = 1; m <= 12; m++) {
    const summary = calculateMonthlyCashflow(transactions, year, m);
    months.push({
      month: m,
      ...summary,
    });
    totalIncome += summary.income;
    totalExpense += summary.expense;
  }

  const roundedIncome = roundMoney(totalIncome);
  const roundedExpense = roundMoney(totalExpense);
  const totalNet = roundMoney(roundedIncome - roundedExpense);

  return {
    months,
    total: {
      income: roundedIncome,
      expense: roundedExpense,
      net: totalNet,
    },
  };
}
