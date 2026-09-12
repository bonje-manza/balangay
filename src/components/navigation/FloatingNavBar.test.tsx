import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FloatingNavBar, NavigationTab } from './FloatingNavBar';

describe('FloatingNavBar Component', () => {
  const tabs: NavigationTab[] = ['dashboard', 'transactions', 'budgets', 'accounts', 'settings'];

  it('renders all 5 navigation tabs and quick action button', () => {
    render(<FloatingNavBar activeTab="dashboard" onTabChange={vi.fn()} onAddTransaction={vi.fn()} />);

    tabs.forEach((tab) => {
      expect(screen.getByTestId(`nav-tab-${tab}`)).toBeInTheDocument();
    });

    expect(screen.getByTestId('nav-add-button')).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const handleTabChange = vi.fn();
    render(<FloatingNavBar activeTab="dashboard" onTabChange={handleTabChange} />);

    const budgetsTab = screen.getByTestId('nav-tab-budgets');
    fireEvent.click(budgetsTab);

    expect(handleTabChange).toHaveBeenCalledWith('budgets');
  });

  it('highlights the currently active tab', () => {
    render(<FloatingNavBar activeTab="transactions" onTabChange={vi.fn()} />);

    const activeTab = screen.getByTestId('nav-tab-transactions');
    expect(activeTab.getAttribute('aria-current')).toBe('page');

    const inactiveTab = screen.getByTestId('nav-tab-dashboard');
    expect(inactiveTab.getAttribute('aria-current')).toBeNull();
  });

  it('calls onAddTransaction when quick action button is clicked', () => {
    const handleAdd = vi.fn();
    render(<FloatingNavBar activeTab="dashboard" onTabChange={vi.fn()} onAddTransaction={handleAdd} />);

    const addBtn = screen.getByTestId('nav-add-button');
    fireEvent.click(addBtn);

    expect(handleAdd).toHaveBeenCalledTimes(1);
  });
});
