import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OnboardingModal } from './OnboardingModal';
import { db, resetDatabase } from '../../storage/db';
import { getUserSettings } from '../../storage/settingsRepository';
import { getAccounts } from '../../storage/accountRepository';

describe('OnboardingModal Component', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('does not render when isOpen is false', () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={false} onComplete={handleComplete} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/Mabuhay! Welcome to Balangay/i)).not.toBeInTheDocument();
  });

  it('renders welcoming greeting and currency indicator when isOpen is true', () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // Dialog container
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Welcome headline & subtitle in Fraunces serif
    expect(screen.getByText(/Mabuhay! Welcome to Balangay/i)).toBeInTheDocument();
    expect(screen.getByText(/mindful.*financial companion/i)).toBeInTheDocument();

    // Currency indicator: Philippine Peso (PHP, ₱)
    expect(screen.getByText(/Philippine Peso/i)).toBeInTheDocument();
    expect(screen.getByText(/PHP/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₱/i).length).toBeGreaterThan(0);

    // Prominent "Try with Sample Data" and "Setup My Accounts" buttons
    expect(screen.getByRole('button', { name: /Try with Sample Data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Setup My Accounts/i })).toBeInTheDocument();
  });

  it('clicking "Try with Sample Data" loads demo seed, marks onboarding complete, and calls onComplete', async () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    const demoButton = screen.getByRole('button', { name: /Try with Sample Data/i });
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    // Check settings updated
    const settings = await getUserSettings();
    expect(settings.hasCompletedOnboarding).toBe(true);

    // Check default categories, accounts, and demo transactions seeded
    const categoryCount = await db.categories.count();
    const accountCount = await db.accounts.count();
    const txCount = await db.transactions.count();

    expect(categoryCount).toBeGreaterThanOrEqual(12);
    expect(accountCount).toBeGreaterThanOrEqual(5);
    expect(txCount).toBeGreaterThanOrEqual(15);
  });

  it('supports step navigation between Welcome/Currency and Account Selection', () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // In Step 1 initially
    expect(screen.getByText(/Mabuhay! Welcome to Balangay/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose Your Starter Accounts/i)).not.toBeInTheDocument();

    // Click "Setup My Accounts" to go to Step 2
    const setupButton = screen.getByRole('button', { name: /Setup My Accounts/i });
    fireEvent.click(setupButton);

    // In Step 2: Account selection
    expect(screen.getByText(/Choose Your Starter Accounts/i)).toBeInTheDocument();
    expect(screen.getByText('GCash')).toBeInTheDocument();
    expect(screen.getByText('Maya')).toBeInTheDocument();
    expect(screen.getByText('BPI Savings')).toBeInTheDocument();
    expect(screen.getByText('BDO Checking / Savings')).toBeInTheDocument();
    expect(screen.getByText('Cash Wallet')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();

    // Click "Back" to return to Step 1
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);

    // Back in Step 1
    expect(screen.getByText(/Mabuhay! Welcome to Balangay/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose Your Starter Accounts/i)).not.toBeInTheDocument();
  });

  it('toggling account checkboxes adds/removes accounts from selection', () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // Navigate to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Setup My Accounts/i }));

    const gcashCheckbox = screen.getByLabelText(/GCash/i) as HTMLInputElement;
    const creditCheckbox = screen.getByLabelText(/Credit Card/i) as HTMLInputElement;

    // Initially accounts should be checked by default
    expect(gcashCheckbox.checked).toBe(true);
    expect(creditCheckbox.checked).toBe(true);

    // Uncheck GCash
    fireEvent.click(gcashCheckbox);
    expect(gcashCheckbox.checked).toBe(false);

    // Toggle again to re-check
    fireEvent.click(gcashCheckbox);
    expect(gcashCheckbox.checked).toBe(true);

    // Uncheck Credit Card
    fireEvent.click(creditCheckbox);
    expect(creditCheckbox.checked).toBe(false);
  });

  it('completing custom setup creates selected accounts in Dexie with custom balances and calls onComplete', async () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // Navigate to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Setup My Accounts/i }));

    // Uncheck Credit Card and BDO
    const creditCheckbox = screen.getByLabelText(/Credit Card/i);
    const bdoCheckbox = screen.getByLabelText(/BDO Checking \/ Savings/i);
    fireEvent.click(creditCheckbox);
    fireEvent.click(bdoCheckbox);

    // Modify GCash initial balance to 5000
    const gcashBalanceInput = screen.getByTestId('balance-input-acc-gcash');
    fireEvent.change(gcashBalanceInput, { target: { value: '5000' } });

    // Click "Start Tracking" button
    const startTrackingButton = screen.getByRole('button', { name: /Start Tracking/i });
    fireEvent.click(startTrackingButton);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    // Check settings updated
    const settings = await getUserSettings();
    expect(settings.hasCompletedOnboarding).toBe(true);

    // Check categories were seeded
    const categoryCount = await db.categories.count();
    expect(categoryCount).toBeGreaterThanOrEqual(12);

    // Check created accounts
    const accounts = await getAccounts();
    const accountNames = accounts.map((a) => a.name);

    expect(accountNames).toContain('GCash');
    expect(accountNames).toContain('Maya');
    expect(accountNames).toContain('BPI Savings');
    expect(accountNames).toContain('Cash Wallet');
    expect(accountNames).not.toContain('Credit Card');
    expect(accountNames).not.toContain('BDO Checking / Savings');

    const gcash = accounts.find((a) => a.name === 'GCash');
    expect(gcash?.initialBalance).toBe(5000);
  });

  it('supports navigation back to Step 1 using the top Previous button', () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // Go to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Setup My Accounts/i }));
    expect(screen.getByText(/Choose Your Starter Accounts/i)).toBeInTheDocument();

    // Click "Previous" in the header
    const previousButton = screen.getByRole('button', { name: /Previous step/i });
    fireEvent.click(previousButton);

    // Returned to Step 1
    expect(screen.getByText(/Mabuhay! Welcome to Balangay/i)).toBeInTheDocument();
  });

  it('sanitizes empty and negative balance inputs safely', async () => {
    const handleComplete = vi.fn();
    render(<OnboardingModal isOpen={true} onComplete={handleComplete} />);

    // Navigate to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Setup My Accounts/i }));

    // Change GCash balance to empty string, then to negative
    const gcashBalanceInput = screen.getByTestId('balance-input-acc-gcash');
    fireEvent.change(gcashBalanceInput, { target: { value: '' } });
    expect(gcashBalanceInput).toHaveValue(0);

    fireEvent.change(gcashBalanceInput, { target: { value: '-200' } });
    // Math.max(0, parsed) sets it to 0
    expect(gcashBalanceInput).toHaveValue(0);
  });
});

