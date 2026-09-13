import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';
import type { Account, Category, Transaction } from '../../domain/types';
import {
  calculateDailyCashflow,
  calculateYearlyCashflow,
} from '../../domain/calculations';
import { CashFlowCalendar } from './CashFlowCalendar';
import { DayInspector } from './DayInspector';
import { CashFlowBarChart, type CashFlowBarItem } from './CashFlowBarChart';
import { YearlyCashFlowGrid } from './YearlyCashFlowGrid';
import { Button } from '../ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  CalendarRange,
} from 'lucide-react';

export interface CashFlowViewProps {
  categories?: Category[];
  transactions?: Transaction[];
  accounts?: Account[];
  currentDate?: Date;
  onOpenAddTransaction?: (date?: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  className?: string;
}

type ViewMode = 'calendar' | 'year';

const MONTH_ABBRS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  categories: propCategories,
  transactions: propTransactions,
  accounts: propAccounts,
  currentDate,
  onOpenAddTransaction,
  onEditTransaction,
  className = '',
}) => {
  // Live queries with test prop fallbacks
  const liveAccounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];
  const liveCategories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];

  const accounts = propAccounts || liveAccounts;
  const categories = propCategories || liveCategories;
  const transactions = propTransactions || liveTransactions;

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<Date>(() => currentDate || new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1; // 1-indexed
  const day = selectedDate.getDate();

  // Active date string 'YYYY-MM-DD'
  const [activeDateStr, setActiveDateStr] = useState<string>(() => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  // Keep activeDateStr in sync if month/year changes and day exceeds month days
  const formattedMonth = useMemo(() => {
    return selectedDate.toLocaleDateString('en-PH', {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Daily cashflow map for the active month
  const dailyCashflow = useMemo(() => {
    return calculateDailyCashflow(transactions, year, month);
  }, [transactions, year, month]);

  // Yearly cashflow summary for the active year
  const yearlyCashflow = useMemo(() => {
    return calculateYearlyCashflow(transactions, year);
  }, [transactions, year]);

  // Daily chart data for active month
  const dailyChartData = useMemo<CashFlowBarItem[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: CashFlowBarItem[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cf = dailyCashflow.get(dateKey) || { income: 0, expense: 0, net: 0 };
      items.push({
        label: String(d),
        dateKey,
        income: cf.income,
        expense: cf.expense,
        net: cf.net,
      });
    }

    return items;
  }, [year, month, dailyCashflow]);

  // Monthly chart data for active year
  const monthlyChartData = useMemo<CashFlowBarItem[]>(() => {
    return yearlyCashflow.months.map((m) => ({
      label: MONTH_ABBRS[m.month - 1],
      dateKey: `${year}-${String(m.month).padStart(2, '0')}`,
      income: m.income,
      expense: m.expense,
      net: m.net,
    }));
  }, [year, yearlyCashflow]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'calendar') {
      setSelectedDate((prev) => {
        const nextDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        const y = nextDate.getFullYear();
        const m = nextDate.getMonth() + 1;
        setActiveDateStr(`${y}-${String(m).padStart(2, '0')}-01`);
        return nextDate;
      });
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'calendar') {
      setSelectedDate((prev) => {
        const nextDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        const y = nextDate.getFullYear();
        const m = nextDate.getMonth() + 1;
        setActiveDateStr(`${y}-${String(m).padStart(2, '0')}-01`);
        return nextDate;
      });
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setActiveDateStr(now.toISOString().slice(0, 10));
  };

  const handleSelectBar = (item: CashFlowBarItem) => {
    if (viewMode === 'calendar' && item.dateKey) {
      setActiveDateStr(item.dateKey);
    } else if (viewMode === 'year' && item.dateKey) {
      const parts = item.dateKey.split('-');
      const targetMonth = parseInt(parts[1], 10);
      setSelectedDate(new Date(year, targetMonth - 1, 1));
      setActiveDateStr(`${year}-${String(targetMonth).padStart(2, '0')}-01`);
      setViewMode('calendar');
    }
  };

  const handleSelectYearMonth = (targetMonth: number) => {
    setSelectedDate(new Date(year, targetMonth - 1, 1));
    setActiveDateStr(`${year}-${String(targetMonth).padStart(2, '0')}-01`);
    setViewMode('calendar');
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="cash-flow-view">
      {/* Navigation Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-800/10">
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-2xl border border-stone-800/20 shadow-sm p-1">
            <button
              type="button"
              data-testid="prev-month-btn"
              title={viewMode === 'calendar' ? 'Previous Month' : 'Previous Year'}
              aria-label={viewMode === 'calendar' ? 'Previous Month' : 'Previous Year'}
              onClick={handlePrev}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-serif font-bold text-sm sm:text-base text-[#111111] px-3 min-w-[140px] text-center select-none">
              {viewMode === 'calendar' ? formattedMonth : `${year} Annual`}
            </span>

            <button
              type="button"
              data-testid="next-month-btn"
              title={viewMode === 'calendar' ? 'Next Month' : 'Next Year'}
              aria-label={viewMode === 'calendar' ? 'Next Month' : 'Next Year'}
              onClick={handleNext}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="today-reset-btn"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleToday}
          >
            Today
          </Button>
        </div>

        {/* View Mode Segmented Switcher */}
        <div
          role="tablist"
          aria-label="Cash Flow View Mode"
          className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-800/15 select-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Month Calendar</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'year'}
            onClick={() => setViewMode('year')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'year'
                ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Year Overview</span>
          </button>
        </div>
      </div>

      {/* Main Mode Content */}
      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          {/* Top: Responsive Calendar Grid */}
          <CashFlowCalendar
            year={year}
            month={month}
            dailyCashflow={dailyCashflow}
            selectedDate={activeDateStr}
            onSelectDate={(dateKey) => setActiveDateStr(dateKey)}
          />

          {/* Middle: Day Inspector Panel */}
          <DayInspector
            dateStr={activeDateStr}
            cashflow={dailyCashflow.get(activeDateStr)}
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onAddTransactionForDate={(d) => {
              if (onOpenAddTransaction) onOpenAddTransaction(d);
            }}
            onEditTransaction={onEditTransaction}
          />

          {/* Bottom: Daily Cash Flow Bar Chart */}
          <CashFlowBarChart
            mode="daily"
            data={dailyChartData}
            onSelectBar={handleSelectBar}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Trajectory Bar Chart */}
          <CashFlowBarChart
            mode="monthly"
            data={monthlyChartData}
            onSelectBar={handleSelectBar}
          />

          {/* 12-Month Matrix */}
          <YearlyCashFlowGrid
            year={year}
            yearlySummary={yearlyCashflow}
            onSelectMonth={handleSelectYearMonth}
          />
        </div>
      )}
    </div>
  );
};
