import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Settings,
  Plus,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'transactions' | 'budgets' | 'accounts' | 'settings';

export interface FloatingNavBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onAddTransaction?: () => void;
  className?: string;
}

interface TabItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const leftTabs: TabItemConfig[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'History', icon: ArrowLeftRight },
];

const rightTabs: TabItemConfig[] = [
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'accounts', label: 'Wallets', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * FloatingNavBar: Soft Neo-brutalist floating navigation dock anchored at the bottom.
 * Dark Anchor background (#111111) with playful active indicators and tactile Butter Add CTA.
 */
export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeTab,
  onTabChange,
  onAddTransaction,
  className = '',
}) => {
  const renderTabButton = (item: TabItemConfig) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        data-testid={`nav-tab-${item.id}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        onClick={() => onTabChange(item.id)}
        className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer select-none text-xs font-semibold ${
          isActive
            ? 'bg-stone-800 text-[#FFFDF9] shadow-[1px_1px_0px_0px_#000000]'
            : 'text-stone-400 hover:text-[#FFFDF9] hover:bg-stone-800'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] ${className}`}
    >
      <div className="bg-[#111111] text-[#F7F2E8] rounded-full border-2 border-stone-700/60 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 shadow-[4px_4px_0px_0px_#124224] backdrop-blur-none">
        {/* Left Navigation Tabs */}
        {leftTabs.map(renderTabButton)}

        {/* Center / Quick Action Floating Add Button */}
        {onAddTransaction && (
          <button
            type="button"
            data-testid="nav-add-button"
            onClick={onAddTransaction}
            className="inline-flex items-center gap-1 bg-[#FFED9E] text-[#111111] hover:bg-[#FFF3B8] font-bold text-xs px-3 sm:px-3.5 py-1.5 rounded-full border border-stone-800/20 shadow-[2px_2px_0px_0px_#000000] active:translate-y-0.5 transition-all cursor-pointer mx-0.5 flex-shrink-0"
            aria-label="Add transaction"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-extrabold">Add</span>
          </button>
        )}

        {/* Right Navigation Tabs */}
        {rightTabs.map(renderTabButton)}
      </div>
    </nav>
  );
};
