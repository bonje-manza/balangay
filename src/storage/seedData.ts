import { db } from './db';
import type { Account, Category, Transaction, AccountType } from '../domain/types';

export interface StarterAccountTemplate {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  initialBalance: number;
  currency?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  {
    id: 'cat-food-dining',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#FFED9E',
    budgetLimit: 8000,
    isDefault: true,
  },
  {
    id: 'cat-groceries',
    name: 'Groceries & Market',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#DAE097',
    budgetLimit: 10000,
    isDefault: true,
  },
  {
    id: 'cat-transpo',
    name: 'Transpo, Gas & Commute',
    type: 'expense',
    icon: 'Bus',
    color: '#A6CFF2',
    budgetLimit: 4000,
    isDefault: true,
  },
  {
    id: 'cat-utilities',
    name: 'Utilities & Bills (Electricity/Water/Internet)',
    type: 'expense',
    icon: 'Zap',
    color: '#F2C0CA',
    budgetLimit: 6000,
    isDefault: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping & Treats',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#FFED9E',
    budgetLimit: 3000,
    isDefault: true,
  },
  {
    id: 'cat-health',
    name: 'Health & Wellness',
    type: 'expense',
    icon: 'Heart',
    color: '#F2C0CA',
    budgetLimit: 2500,
    isDefault: true,
  },
  {
    id: 'cat-housing',
    name: 'Housing & Rent',
    type: 'expense',
    icon: 'Home',
    color: '#DAE097',
    budgetLimit: 12000,
    isDefault: true,
  },
  {
    id: 'cat-fees',
    name: 'GCash / Bank Fees',
    type: 'expense',
    icon: 'CreditCard',
    color: '#A6CFF2',
    budgetLimit: 500,
    isDefault: true,
  },
  // Income Categories
  {
    id: 'cat-salary',
    name: 'Salary & Wages',
    type: 'income',
    icon: 'Briefcase',
    color: '#DAE097',
    isDefault: true,
  },
  {
    id: 'cat-freelance',
    name: 'Freelance & Side Gigs',
    type: 'income',
    icon: 'Laptop',
    color: '#A6CFF2',
    isDefault: true,
  },
  {
    id: 'cat-allowances',
    name: 'Allowances & Gifts',
    type: 'income',
    icon: 'Gift',
    color: '#FFED9E',
    isDefault: true,
  },
  {
    id: 'cat-investments',
    name: 'Investments & Dividends',
    type: 'income',
    icon: 'TrendingUp',
    color: '#DAE097',
    isDefault: true,
  },
];

export const PHILIPPINE_STARTER_ACCOUNTS: StarterAccountTemplate[] = [
  {
    id: 'acc-gcash',
    name: 'GCash',
    type: 'ewallet',
    color: '#A6CFF2',
    icon: 'Smartphone',
    initialBalance: 2500,
    currency: 'PHP',
  },
  {
    id: 'acc-maya',
    name: 'Maya',
    type: 'ewallet',
    color: '#DAE097',
    icon: 'Smartphone',
    initialBalance: 1500,
    currency: 'PHP',
  },
  {
    id: 'acc-bpi',
    name: 'BPI Savings',
    type: 'bank',
    color: '#F2C0CA',
    icon: 'Building2',
    initialBalance: 15000,
    currency: 'PHP',
  },
  {
    id: 'acc-bdo',
    name: 'BDO Checking / Savings',
    type: 'bank',
    color: '#A6CFF2',
    icon: 'Building2',
    initialBalance: 10000,
    currency: 'PHP',
  },
  {
    id: 'acc-cash',
    name: 'Cash Wallet',
    type: 'cash',
    color: '#FFED9E',
    icon: 'Wallet',
    initialBalance: 2000,
    currency: 'PHP',
  },
  {
    id: 'acc-credit',
    name: 'Credit Card',
    type: 'credit',
    color: '#111111',
    icon: 'CreditCard',
    initialBalance: 0,
    currency: 'PHP',
  },
];

/**
 * Seeds default Philippine categories if the category table is currently empty.
 * Idempotent.
 */
export async function seedDefaultCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
}

/**
 * Seeds starter accounts. Optionally filters by template names or IDs.
 * Idempotent: does not overwrite or duplicate existing accounts.
 */
export async function seedStarterAccounts(selectedAccountTemplates?: string[]): Promise<void> {
  let templatesToSeed = PHILIPPINE_STARTER_ACCOUNTS;

  if (selectedAccountTemplates && selectedAccountTemplates.length > 0) {
    const normalizedSelection = selectedAccountTemplates.map((item) => item.trim().toLowerCase());
    templatesToSeed = templatesToSeed.filter(
      (tpl) =>
        normalizedSelection.includes(tpl.id.toLowerCase()) ||
        normalizedSelection.includes(tpl.name.toLowerCase())
    );
  }

  const now = new Date().toISOString();

  for (const tpl of templatesToSeed) {
    const existing = await db.accounts.get(tpl.id);
    if (!existing) {
      const newAccount: Account = {
        id: tpl.id,
        name: tpl.name,
        type: tpl.type,
        initialBalance: tpl.initialBalance,
        currency: tpl.currency || 'PHP',
        color: tpl.color,
        icon: tpl.icon,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      await db.accounts.add(newAccount);
    }
  }
}

/**
 * Loads rich demo data with categories, accounts, and 18 realistic Philippine transactions
 * spanning the past 30 days demonstrating cashflow, transfers, bills, and mood tracking.
 */
export async function loadSampleDemoData(): Promise<void> {
  await seedDefaultCategories();
  await seedStarterAccounts();

  const getPastDate = (daysAgo: number): string => {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const now = new Date().toISOString();

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-demo-1',
      amount: 45000,
      type: 'income',
      accountId: 'acc-bpi',
      categoryId: 'cat-salary',
      date: getPastDate(28),
      notes: 'Mid-month Salary Payroll Direct Deposit',
      mood: 'Peaceful',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-2',
      amount: 10000,
      type: 'transfer',
      accountId: 'acc-bpi',
      toAccountId: 'acc-gcash',
      date: getPastDate(27),
      notes: 'Fund GCash from BPI for monthly expenses',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-3',
      amount: 12000,
      type: 'expense',
      accountId: 'acc-bpi',
      categoryId: 'cat-housing',
      date: getPastDate(26),
      notes: 'Monthly Condo / Apartment Rental',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-4',
      amount: 4250,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-groceries',
      date: getPastDate(24),
      notes: 'SM Supermarket monthly grocery restocking',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-5',
      amount: 3800,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-utilities',
      date: getPastDate(22),
      notes: 'Meralco electric bill payment',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-6',
      amount: 1699,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-utilities',
      date: getPastDate(20),
      notes: 'Converge Fiber high-speed internet bill',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-7',
      amount: 580,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-food-dining',
      date: getPastDate(18),
      notes: 'Weekend dinner with friends at Ramen Nagi',
      mood: 'Treat',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-8',
      amount: 280,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-transpo',
      date: getPastDate(16),
      notes: 'Grab ride to Makati business meeting',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-9',
      amount: 15000,
      type: 'income',
      accountId: 'acc-maya',
      categoryId: 'cat-freelance',
      date: getPastDate(14),
      notes: 'Frontend UI design client project milestone',
      mood: 'Peaceful',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-10',
      amount: 1450,
      type: 'expense',
      accountId: 'acc-maya',
      categoryId: 'cat-shopping',
      date: getPastDate(12),
      notes: 'Shopee desk mat and ergonomics accessories',
      mood: 'Treat',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-11',
      amount: 850,
      type: 'expense',
      accountId: 'acc-cash',
      categoryId: 'cat-health',
      date: getPastDate(10),
      notes: 'Mercury Drug vitamins and maintenance supplies',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-12',
      amount: 2100,
      type: 'expense',
      accountId: 'acc-bdo',
      categoryId: 'cat-groceries',
      date: getPastDate(8),
      notes: 'Puregold weekend fresh pantry and fruit restocking',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-13',
      amount: 340,
      type: 'expense',
      accountId: 'acc-cash',
      categoryId: 'cat-food-dining',
      date: getPastDate(7),
      notes: 'Jollibee 2pc Chickenjoy and peach mango pie',
      mood: 'Treat',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-14',
      amount: 3000,
      type: 'transfer',
      accountId: 'acc-maya',
      toAccountId: 'acc-gcash',
      date: getPastDate(5),
      notes: 'InstaPay transfer from Maya to GCash',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-15',
      amount: 15,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-fees',
      date: getPastDate(5),
      notes: 'InstaPay bank transfer convenience fee',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-16',
      amount: 1500,
      type: 'expense',
      accountId: 'acc-bdo',
      categoryId: 'cat-transpo',
      date: getPastDate(4),
      notes: 'Shell V-Power gasoline full tank top up',
      mood: 'Essential',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-17',
      amount: 2000,
      type: 'income',
      accountId: 'acc-cash',
      categoryId: 'cat-allowances',
      date: getPastDate(3),
      notes: 'Birthday cash gift from family',
      mood: 'Peaceful',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-demo-18',
      amount: 220,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-food-dining',
      date: getPastDate(1),
      notes: 'Iced Spanish Latte at neighborhood cafe',
      mood: 'Treat',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Bulk add demo transactions idempotently
  for (const tx of sampleTransactions) {
    const existing = await db.transactions.get(tx.id);
    if (!existing) {
      await db.transactions.add(tx);
    }
  }
}
