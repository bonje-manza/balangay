import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { resetDatabase } from './storage/db';
import { saveUserSettings } from './storage/settingsRepository';
import { hashPin } from './services/securityService';

describe('App Root Shell', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await resetDatabase();
    vi.clearAllMocks();
  });

  it('renders successfully with brand title "Balangay" and offline indicator', async () => {
    render(<App />);

    const brandTitles = await screen.findAllByText(/Balangay/i);
    expect(brandTitles.length).toBeGreaterThan(0);
    expect(brandTitles[0]).toBeInTheDocument();

    expect(await screen.findByText(/Offline Ready/i)).toBeInTheDocument();
  });

  it('wires OnboardingModal when user has not completed onboarding', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: /Mabuhay! Welcome to Balangay/i })
    ).toBeInTheDocument();
  });

  it('wires SecurityProvider and renders PinLockScreen when PIN is active and vault is locked', async () => {
    const hashed = await hashPin('4321');
    await saveUserSettings({
      hasCompletedOnboarding: true,
      pinEnabled: true,
      pinHash: hashed,
    });

    render(<App />);

    expect(await screen.findByTestId('pin-lock-screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Enter PIN to Unlock/i })).toBeInTheDocument();
    expect(screen.getByTestId('keypad-4')).toBeInTheDocument();
  });

  it('renders PinLockScreen with 6 dot indicators when 6-digit PIN is active and unlocks on entry', async () => {
    const hashed = await hashPin('654321');
    await saveUserSettings({
      hasCompletedOnboarding: true,
      pinEnabled: true,
      pinHash: hashed,
      pinLength: 6,
    });

    render(<App />);

    expect(await screen.findByTestId('pin-lock-screen')).toBeInTheDocument();
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`pin-dot-${i}`)).toBeInTheDocument();
    }

    // Input 654321
    fireEvent.click(screen.getByTestId('keypad-6'));
    fireEvent.click(screen.getByTestId('keypad-5'));
    fireEvent.click(screen.getByTestId('keypad-4'));
    fireEvent.click(screen.getByTestId('keypad-3'));
    fireEvent.click(screen.getByTestId('keypad-2'));
    fireEvent.click(screen.getByTestId('keypad-1'));

    // Should unlock and reveal dashboard
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();
  });

  it('renders FloatingNavBar dock and active Dashboard view when onboarded and unlocked', async () => {
    await saveUserSettings({
      hasCompletedOnboarding: true,
      pinEnabled: false,
    });

    render(<App />);

    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Bottom Navigation/i })).toBeInTheDocument();
    expect(screen.getByTestId('nav-add-button')).toBeInTheDocument();
    expect(screen.getByTestId('nav-tab-dashboard')).toBeInTheDocument();
  });

  it('allows navigating to Budgets tab, switching to Cash Flow & Calendar, and opening Add Transaction prefilled', async () => {
    await saveUserSettings({
      hasCompletedOnboarding: true,
      pinEnabled: false,
    });

    render(<App />);

    // Click Budgets in floating nav
    const budgetsNavBtn = await screen.findByTestId('nav-tab-budgets');
    fireEvent.click(budgetsNavBtn);

    // Verify Budgets view is active
    expect(await screen.findByTestId('budgets-analytics-view')).toBeInTheDocument();

    // Click Cash Flow & Calendar subtab
    const cashflowSubTab = screen.getByTestId('subtab-cashflow');
    fireEvent.click(cashflowSubTab);

    // Cash flow view rendered
    expect(await screen.findByTestId('cash-flow-view')).toBeInTheDocument();

    // Click "+ Add for this date" in Day Inspector
    const addForDateBtn = screen.getByTestId('add-tx-for-date-btn');
    fireEvent.click(addForDateBtn);

    // Modal opens
    expect(await screen.findByRole('heading', { name: /^Add Transaction$/i })).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/Date/i) as HTMLInputElement;
    expect(dateInput.value).toBeTruthy();
  });

  it('self-heals corrupted categories with missing name or icon on app load', async () => {
    await saveUserSettings({
      hasCompletedOnboarding: true,
      pinEnabled: false,
    });

    // Seed corrupted category
    const { db } = await import('./storage/db');
    await db.categories.put({
      id: 'cat-food-dining',
      type: 'expense',
      color: '#FFED9E',
      isDefault: true,
    } as any);

    render(<App />);

    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    const { waitFor } = await import('@testing-library/react');
    await waitFor(async () => {
      const repaired = await db.categories.get('cat-food-dining');
      expect(repaired?.name).toBe('Food & Dining');
      expect(repaired?.icon).toBe('Utensils');
    });
  });
});
