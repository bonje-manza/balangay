import { describe, it, expect } from 'vitest';
import type { Account, Transaction } from './types';
import {
  calculateAccountBalances,
  calculateNetWorth,
  calculateMonthlyCashflow,
  calculateCategorySpending,
  calculateBudgetProgress,
  calculateDailyCashflow,
  calculateYearlyCashflow,
} from './calculations';

describe('calculateAccountBalances', () => {
  const sampleAccounts: Account[] = [
    {
      id: 'acc-cash',
      name: 'Cash in Wallet',
      type: 'cash',
      initialBalance: 1500,
      currency: 'PHP',
      color: '#DAE097',
      icon: 'wallet',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'acc-bank',
      name: 'BDO Checking',
      type: 'bank',
      initialBalance: 25000,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'building-2',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'acc-credit',
      name: 'BPI Credit Card',
      type: 'credit',
      initialBalance: 0,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'credit-card',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  it('returns initial balances when there are no transactions', () => {
    const balances = calculateAccountBalances(sampleAccounts, []);
    expect(balances.get('acc-cash')).toBe(1500);
    expect(balances.get('acc-bank')).toBe(25000);
    expect(balances.get('acc-credit')).toBe(0);
  });

  it('returns empty map when accounts list is empty', () => {
    const balances = calculateAccountBalances([], []);
    expect(balances.size).toBe(0);
  });

  it('adds income to the target account', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 5000,
        type: 'income',
        accountId: 'acc-bank',
        categoryId: 'cat-salary',
        date: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-bank')).toBe(30000);
    expect(balances.get('acc-cash')).toBe(1500);
  });

  it('subtracts expenses from the source account', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 250.5,
        type: 'expense',
        accountId: 'acc-cash',
        categoryId: 'cat-food',
        date: '2026-09-02',
        createdAt: '2026-09-02T12:00:00Z',
        updatedAt: '2026-09-02T12:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-cash')).toBe(1249.5);
  });

  it('handles transfer between two accounts', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 3000,
        type: 'transfer',
        accountId: 'acc-bank',
        toAccountId: 'acc-cash',
        date: '2026-09-03',
        createdAt: '2026-09-03T14:00:00Z',
        updatedAt: '2026-09-03T14:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-bank')).toBe(22000);
    expect(balances.get('acc-cash')).toBe(4500);
  });

  it('handles credit card spending resulting in negative balance', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 1200,
        type: 'expense',
        accountId: 'acc-credit',
        categoryId: 'cat-groceries',
        date: '2026-09-04',
        createdAt: '2026-09-04T15:00:00Z',
        updatedAt: '2026-09-04T15:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-credit')).toBe(-1200);
  });

  it('handles transfer where source equals destination without corrupting balance', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-self',
        amount: 1000,
        type: 'transfer',
        accountId: 'acc-cash',
        toAccountId: 'acc-cash',
        date: '2026-09-05',
        createdAt: '2026-09-05T10:00:00Z',
        updatedAt: '2026-09-05T10:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-cash')).toBe(1500);
  });

  it('safely handles transactions referencing unknown accounts', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-unknown',
        amount: 500,
        type: 'expense',
        accountId: 'acc-nonexistent',
        categoryId: 'cat-misc',
        date: '2026-09-05',
        createdAt: '2026-09-05T10:00:00Z',
        updatedAt: '2026-09-05T10:00:00Z',
      },
      {
        id: 'tx-unknown-to',
        amount: 500,
        type: 'transfer',
        accountId: 'acc-bank',
        toAccountId: 'acc-nonexistent',
        date: '2026-09-05',
        createdAt: '2026-09-05T10:00:00Z',
        updatedAt: '2026-09-05T10:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    expect(balances.get('acc-bank')).toBe(24500);
    expect(balances.has('acc-nonexistent')).toBe(false);
  });

  it('rounds floating-point accumulators to avoid IEEE 754 precision drift', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 0.1,
        type: 'expense',
        accountId: 'acc-cash',
        date: '2026-09-06',
        createdAt: '2026-09-06T10:00:00Z',
        updatedAt: '2026-09-06T10:00:00Z',
      },
      {
        id: 'tx-2',
        amount: 0.2,
        type: 'expense',
        accountId: 'acc-cash',
        date: '2026-09-06',
        createdAt: '2026-09-06T10:00:00Z',
        updatedAt: '2026-09-06T10:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(sampleAccounts, transactions);
    // 1500 - 0.1 - 0.2 = 1499.7
    expect(balances.get('acc-cash')).toBe(1499.7);
  });
});

describe('calculateNetWorth', () => {
  it('calculates sum of all account balances including negative credit cards', () => {
    const accounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Bank',
        type: 'bank',
        initialBalance: 50000,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'building-2',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'acc-2',
        name: 'Cash',
        type: 'cash',
        initialBalance: 5000,
        currency: 'PHP',
        color: '#DAE097',
        icon: 'wallet',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'acc-3',
        name: 'Credit Card',
        type: 'credit',
        initialBalance: 0,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'credit-card',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 15000,
        type: 'expense',
        accountId: 'acc-3',
        date: '2026-09-01',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];

    // Bank: 50,000 + Cash: 5,000 + Credit: -15,000 = 40,000
    expect(calculateNetWorth(accounts, transactions)).toBe(40000);
  });

  it('returns 0 when there are no accounts', () => {
    expect(calculateNetWorth([], [])).toBe(0);
  });

  it('handles negative net worth correctly', () => {
    const accounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Debt',
        type: 'credit',
        initialBalance: -10000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'credit-card',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    expect(calculateNetWorth(accounts, [])).toBe(-10000);
  });
});

describe('calculateMonthlyCashflow', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-inc-sep',
      amount: 45000,
      type: 'income',
      accountId: 'acc-1',
      categoryId: 'cat-salary',
      date: '2026-09-01',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'tx-exp1-sep',
      amount: 12000.5,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-rent',
      date: '2026-09-05T12:00:00Z',
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-05T12:00:00Z',
    },
    {
      id: 'tx-exp2-sep-no-cat',
      amount: 350.25,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-09-10',
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'tx-transfer-sep',
      amount: 5000,
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      date: '2026-09-15',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'tx-aug-expense',
      amount: 8000,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      date: '2026-08-25',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z',
    },
    {
      id: 'tx-prev-year',
      amount: 30000,
      type: 'income',
      accountId: 'acc-1',
      categoryId: 'cat-salary',
      date: '2025-09-01',
      createdAt: '2025-09-01T10:00:00Z',
      updatedAt: '2025-09-01T10:00:00Z',
    },
  ];

  it('aggregates income and expenses for specific year and month without counting transfers', () => {
    const cashflow = calculateMonthlyCashflow(transactions, 2026, 9);
    // Income: 45000
    // Expense: 12000.5 + 350.25 = 12350.75
    // Net: 45000 - 12350.75 = 32649.25
    expect(cashflow.income).toBe(45000);
    expect(cashflow.expense).toBe(12350.75);
    expect(cashflow.net).toBe(32649.25);
  });

  it('returns all zeros when no transactions match the given year and month', () => {
    const cashflow = calculateMonthlyCashflow(transactions, 2026, 12);
    expect(cashflow).toEqual({
      income: 0,
      expense: 0,
      net: 0,
    });
  });

  it('handles negative net cashflow when expenses exceed income', () => {
    const expensesOnly: Transaction[] = [
      {
        id: 'tx-1',
        amount: 2500,
        type: 'expense',
        accountId: 'acc-1',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
    ];

    const cashflow = calculateMonthlyCashflow(expensesOnly, 2026, 9);
    expect(cashflow.income).toBe(0);
    expect(cashflow.expense).toBe(2500);
    expect(cashflow.net).toBe(-2500);
  });
});

describe('calculateCategorySpending', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 450.5,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      date: '2026-09-02',
      createdAt: '2026-09-02T10:00:00Z',
      updatedAt: '2026-09-02T10:00:00Z',
    },
    {
      id: 'tx-2',
      amount: 150.25,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      date: '2026-09-05',
      createdAt: '2026-09-05T10:00:00Z',
      updatedAt: '2026-09-05T10:00:00Z',
    },
    {
      id: 'tx-3',
      amount: 1200,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-bills',
      date: '2026-09-10',
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'tx-no-cat',
      amount: 50,
      type: 'expense',
      accountId: 'acc-1',
      // categoryId omitted
      date: '2026-09-12',
      createdAt: '2026-09-12T10:00:00Z',
      updatedAt: '2026-09-12T10:00:00Z',
    },
    {
      id: 'tx-income',
      amount: 10000,
      type: 'income',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      date: '2026-09-15',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'tx-diff-month',
      amount: 800,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-food',
      date: '2026-08-20',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z',
    },
  ];

  it('aggregates expenses per category for the specified month and year', () => {
    const spending = calculateCategorySpending(transactions, 2026, 9);
    // cat-food: 450.50 + 150.25 = 600.75
    expect(spending.get('cat-food')).toBe(600.75);
    // cat-bills: 1200
    expect(spending.get('cat-bills')).toBe(1200);
    // Income must not be included
    expect(spending.size).toBe(2);
  });

  it('safely ignores expenses without categoryId', () => {
    const spending = calculateCategorySpending(transactions, 2026, 9);
    expect(spending.has(undefined as unknown as string)).toBe(false);
    expect(spending.has('')).toBe(false);
  });

  it('returns empty map when no transactions match', () => {
    const spending = calculateCategorySpending(transactions, 2026, 1);
    expect(spending.size).toBe(0);
  });
});

describe('calculateBudgetProgress', () => {
  it('calculates progress under 80% (normal status)', () => {
    const result = calculateBudgetProgress(10000, 5000);
    expect(result).toEqual({
      limit: 10000,
      spent: 5000,
      remaining: 5000,
      percent: 50,
      isWarning: false,
      isOverBudget: false,
    });
  });

  it('triggers warning status at exactly 80%', () => {
    const result = calculateBudgetProgress(10000, 8000);
    expect(result.percent).toBe(80);
    expect(result.remaining).toBe(2000);
    expect(result.isWarning).toBe(true);
    expect(result.isOverBudget).toBe(false);
  });

  it('triggers warning status at 95% (between 80% and 100%)', () => {
    const result = calculateBudgetProgress(10000, 9500);
    expect(result.percent).toBe(95);
    expect(result.isWarning).toBe(true);
    expect(result.isOverBudget).toBe(false);
  });

  it('triggers warning status at exactly 100%', () => {
    const result = calculateBudgetProgress(10000, 10000);
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.isWarning).toBe(true);
    expect(result.isOverBudget).toBe(false);
  });

  it('triggers overBudget when spending exceeds 100%', () => {
    const result = calculateBudgetProgress(10000, 10001);
    expect(result.percent).toBe(100.01);
    expect(result.remaining).toBe(-1);
    expect(result.isWarning).toBe(false);
    expect(result.isOverBudget).toBe(true);
  });

  it('handles zero budget limit gracefully without division by zero', () => {
    const result = calculateBudgetProgress(0, 500);
    expect(result.percent).toBe(0);
    expect(result.remaining).toBe(-500);
    expect(result.isWarning).toBe(false);
    expect(result.isOverBudget).toBe(false);
  });

  it('handles negative budget limit gracefully without NaN or negative percentages', () => {
    const result = calculateBudgetProgress(-500, 100);
    expect(result.percent).toBe(0);
    expect(result.remaining).toBe(-600);
    expect(result.isWarning).toBe(false);
    expect(result.isOverBudget).toBe(false);
  });

  it('handles zero spent correctly', () => {
    const result = calculateBudgetProgress(5000, 0);
    expect(result.percent).toBe(0);
    expect(result.remaining).toBe(5000);
    expect(result.isWarning).toBe(false);
    expect(result.isOverBudget).toBe(false);
  });

  it('rounds floating-point precision on remaining and percent', () => {
    const result = calculateBudgetProgress(300, 100);
    // 100 / 300 = 33.333333333333336 -> 33.33
    expect(result.percent).toBe(33.33);
    expect(result.remaining).toBe(200);
  });
});

describe('additional calculation edge cases', () => {
  it('handles fallback date parsing and invalid dates gracefully in cashflow', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-fallback-date',
        amount: 1000,
        type: 'income',
        accountId: 'acc-1',
        date: 'September 15, 2026 12:00:00',
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
      },
      {
        id: 'tx-invalid-date',
        amount: 500,
        type: 'expense',
        accountId: 'acc-1',
        date: 'not-a-valid-date-string',
        createdAt: '2026-09-15T12:00:00Z',
        updatedAt: '2026-09-15T12:00:00Z',
      },
    ];

    const cashflow = calculateMonthlyCashflow(transactions, 2026, 9);
    expect(cashflow.income).toBe(1000);
    expect(cashflow.expense).toBe(0);
    expect(cashflow.net).toBe(1000);
  });

  it('handles transfer when source is unknown or toAccountId is undefined', () => {
    const accounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Account 1',
        type: 'bank',
        initialBalance: 1000,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'building-2',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 'tx-no-to',
        amount: 200,
        type: 'transfer',
        accountId: 'acc-1',
        // toAccountId intentionally omitted
        date: '2026-09-01',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'tx-unknown-source',
        amount: 300,
        type: 'transfer',
        accountId: 'acc-unknown',
        toAccountId: 'acc-1',
        date: '2026-09-02',
        createdAt: '2026-09-02T00:00:00Z',
        updatedAt: '2026-09-02T00:00:00Z',
      },
    ];

    const balances = calculateAccountBalances(accounts, transactions);
    // Initial 1000 - 200 (deducted by tx-no-to) + 300 (received from unknown source) = 1100
    expect(balances.get('acc-1')).toBe(1100);
  });

  it('safely handles empty categoryId string in calculateCategorySpending', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-empty-cat',
        amount: 250,
        type: 'expense',
        accountId: 'acc-1',
        categoryId: '',
        date: '2026-09-05',
        createdAt: '2026-09-05T00:00:00Z',
        updatedAt: '2026-09-05T00:00:00Z',
      },
    ];

    const spending = calculateCategorySpending(transactions, 2026, 9);
    expect(spending.size).toBe(0);
  });
});

describe('calculateDailyCashflow', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 1500,
      type: 'income',
      accountId: 'acc-1',
      date: '2026-09-05',
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z',
    },
    {
      id: 'tx-2',
      amount: 450,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-09-05',
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z',
    },
    {
      id: 'tx-3',
      amount: 100,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-09-05T12:30:00Z', // ISO format
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z',
    },
    {
      id: 'tx-4',
      amount: 2000,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-09-12',
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
    },
    {
      id: 'tx-transfer',
      amount: 500,
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      date: '2026-09-05',
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z',
    },
    {
      id: 'tx-diff-month',
      amount: 3000,
      type: 'income',
      accountId: 'acc-1',
      date: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  it('aggregates daily cashflow by YYYY-MM-DD date key', () => {
    const daily = calculateDailyCashflow(transactions, 2026, 9);
    expect(daily.size).toBe(2);

    const day5 = daily.get('2026-09-05');
    expect(day5).toBeDefined();
    expect(day5?.income).toBe(1500);
    expect(day5?.expense).toBe(550); // 450 + 100, transfer ignored
    expect(day5?.net).toBe(950);

    const day12 = daily.get('2026-09-12');
    expect(day12).toBeDefined();
    expect(day12?.income).toBe(0);
    expect(day12?.expense).toBe(2000);
    expect(day12?.net).toBe(-2000);
  });

  it('returns empty map if no transactions match the month', () => {
    const daily = calculateDailyCashflow(transactions, 2026, 8);
    expect(daily.size).toBe(0);
  });
});

describe('calculateYearlyCashflow', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx-jan',
      amount: 10000,
      type: 'income',
      accountId: 'acc-1',
      date: '2026-01-15',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'tx-jan-exp',
      amount: 3000,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-01-20',
      createdAt: '2026-01-20T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    },
    {
      id: 'tx-feb-exp',
      amount: 4000,
      type: 'expense',
      accountId: 'acc-1',
      date: '2026-02-10',
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-02-10T00:00:00Z',
    },
    {
      id: 'tx-other-year',
      amount: 50000,
      type: 'income',
      accountId: 'acc-1',
      date: '2025-12-31',
      createdAt: '2025-12-31T00:00:00Z',
      updatedAt: '2025-12-31T00:00:00Z',
    },
  ];

  it('computes 12 monthly breakdowns and the yearly total', () => {
    const yearly = calculateYearlyCashflow(transactions, 2026);
    expect(yearly.months).toHaveLength(12);

    // January (month 1)
    const jan = yearly.months[0];
    expect(jan.month).toBe(1);
    expect(jan.income).toBe(10000);
    expect(jan.expense).toBe(3000);
    expect(jan.net).toBe(7000);

    // February (month 2)
    const feb = yearly.months[1];
    expect(feb.month).toBe(2);
    expect(feb.income).toBe(0);
    expect(feb.expense).toBe(4000);
    expect(feb.net).toBe(-4000);

    // March (month 3, empty)
    const mar = yearly.months[2];
    expect(mar.income).toBe(0);
    expect(mar.expense).toBe(0);
    expect(mar.net).toBe(0);

    // Total
    expect(yearly.total.income).toBe(10000);
    expect(yearly.total.expense).toBe(7000);
    expect(yearly.total.net).toBe(3000);
  });
});

