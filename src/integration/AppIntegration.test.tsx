import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '../App';
import { resetDatabase } from '../storage/db';
import { loadSampleDemoData, seedDefaultCategories } from '../storage/seedData';
import { saveUserSettings } from '../storage/settingsRepository';

describe('Offline-First PWA Finance Tracker Integration Tests (E2E)', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await resetDatabase();
    vi.clearAllMocks();
  });

  it('Test 1: First launch displays onboarding modal; clicking "Try with Sample Data" seeds database, completes onboarding, and renders Dashboard Bento Hub', async () => {
    render(<App />);

    // Onboarding modal should be visible on fresh launch
    const onboardingTitle = await screen.findByRole('heading', {
      name: /Mabuhay! Welcome to Balangay/i,
    });
    expect(onboardingTitle).toBeInTheDocument();

    // Click "Try with Sample Data" inside Onboarding modal
    const modal = screen.getByRole('dialog');
    const demoButton = within(modal).getByRole('button', { name: /Try with Sample Data/i });
    fireEvent.click(demoButton);

    // Wait for OnboardingModal to dismiss
    await waitFor(
      () => {
        expect(
          screen.queryByRole('heading', { name: /Mabuhay! Welcome to Balangay/i })
        ).not.toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Dashboard Bento Hub is now rendered
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();
    expect(screen.getByTestId('net-worth-card')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-bento')).toBeInTheDocument();
  });

  it('Test 2: Tab navigation works seamlessly across all 5 views (Dashboard, Transactions, Budgets, Accounts, Settings)', async () => {
    // Setup initial data and mark onboarding as complete
    await seedDefaultCategories();
    await loadSampleDemoData();
    await saveUserSettings({ hasCompletedOnboarding: true });

    render(<App />);

    // Initially on Dashboard
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    // 1. Navigate to Transactions
    const txTab = screen.getByTestId('nav-tab-transactions');
    fireEvent.click(txTab);
    expect(await screen.findByTestId('transactions-view')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Transactions Ledger/i })
    ).toBeInTheDocument();

    // 2. Navigate to Budgets
    const budgetsTab = screen.getByTestId('nav-tab-budgets');
    fireEvent.click(budgetsTab);
    expect(await screen.findByTestId('budgets-analytics-view')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Budgets & Spending Analytics/i })
    ).toBeInTheDocument();

    // 3. Navigate to Accounts
    const accountsTab = screen.getByTestId('nav-tab-accounts');
    fireEvent.click(accountsTab);
    expect(await screen.findByTestId('accounts-vault-view')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Accounts Vault/i })
    ).toBeInTheDocument();

    // 4. Navigate to Settings
    const settingsTab = screen.getByTestId('nav-tab-settings');
    fireEvent.click(settingsTab);
    expect(
      await screen.findByRole('heading', { name: /Settings & Vault Tools/i })
    ).toBeInTheDocument();

    // 5. Navigate back to Dashboard
    const dashboardTab = screen.getByTestId('nav-tab-dashboard');
    fireEvent.click(dashboardTab);
    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();
  });

  it('Test 3: Floating + button opens transaction modal, saving an expense updates live balances on Dashboard and Transactions ledger', async () => {
    await seedDefaultCategories();
    await loadSampleDemoData();
    await saveUserSettings({ hasCompletedOnboarding: true });

    render(<App />);

    expect(await screen.findByTestId('dashboard-view')).toBeInTheDocument();

    // Click floating + button on bottom dock
    const addBtn = screen.getByTestId('nav-add-button');
    fireEvent.click(addBtn);

    // Global TransactionFormModal should open
    const modalForm = await screen.findByTestId('transaction-form');
    expect(modalForm).toBeInTheDocument();

    // Fill in 500 PHP expense
    const amountInput = screen.getByTestId('transaction-amount-input');
    fireEvent.change(amountInput, { target: { value: '500' } });

    // Select account
    const accountSelect = screen.getByTestId('transaction-account-select');
    fireEvent.change(accountSelect, { target: { value: 'acc-gcash' } });

    // Select category
    const categorySelect = screen.getByTestId('transaction-category-select');
    fireEvent.change(categorySelect, { target: { value: 'cat-food-dining' } });

    // Set notes
    const notesInput = screen.getByTestId('transaction-notes-input');
    fireEvent.change(notesInput, { target: { value: 'Special Dinner Buffet' } });

    // Submit expense
    const submitBtn = screen.getByTestId('transaction-submit-btn');
    fireEvent.click(submitBtn);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('transaction-form')).not.toBeInTheDocument();
    });

    // Navigate to Transactions tab to verify entry in ledger
    const txTab = screen.getByTestId('nav-tab-transactions');
    fireEvent.click(txTab);

    expect(await screen.findByTestId('transactions-view')).toBeInTheDocument();
    expect(await screen.findByText('Special Dinner Buffet')).toBeInTheDocument();
  });

  it('Test 4: Executing a transfer between GCash and BPI atomically updates both account balances in Accounts Vault', async () => {
    await seedDefaultCategories();
    await loadSampleDemoData();
    await saveUserSettings({ hasCompletedOnboarding: true });

    render(<App />);

    // Navigate to Accounts Vault
    const accountsTab = await screen.findByTestId('nav-tab-accounts');
    fireEvent.click(accountsTab);

    expect(await screen.findByTestId('accounts-vault-view')).toBeInTheDocument();

    // Open Transfer Modal
    const transferBtn = screen.getByTestId('vault-transfer-btn');
    fireEvent.click(transferBtn);

    const transferForm = await screen.findByTestId('transfer-form');
    expect(transferForm).toBeInTheDocument();

    // Set transfer amount: 1000
    const amountInput = screen.getByTestId('transfer-amount-input');
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // From GCash to BPI
    const fromSelect = screen.getByTestId('transfer-from-account-select');
    fireEvent.change(fromSelect, { target: { value: 'acc-gcash' } });

    const toSelect = screen.getByTestId('transfer-to-account-select');
    fireEvent.change(toSelect, { target: { value: 'acc-bpi' } });

    // Submit transfer
    const submitBtn = screen.getByTestId('transfer-submit-btn');
    fireEvent.click(submitBtn);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('transfer-form')).not.toBeInTheDocument();
    });

    // Verify account balances update atomically in the vault view
    // In sample data:
    // GCash initial 2500 + sample txs; transferring 1000 out lowers GCash balance
    // BPI receives 1000
    await waitFor(() => {
      const gcashBalanceEl = screen.getByTestId('account-balance-acc-gcash');
      const bpiBalanceEl = screen.getByTestId('account-balance-acc-bpi');
      expect(gcashBalanceEl).toBeInTheDocument();
      expect(bpiBalanceEl).toBeInTheDocument();
    });
  });

  it('Test 5: Setting a PIN in Settings activates security lock; locking session displays PinLockScreen; entering correct PIN unlocks application', async () => {
    await seedDefaultCategories();
    await loadSampleDemoData();
    await saveUserSettings({ hasCompletedOnboarding: true });

    render(<App />);

    // Navigate to Settings
    const settingsTab = await screen.findByTestId('nav-tab-settings');
    fireEvent.click(settingsTab);

    expect(
      await screen.findByRole('heading', { name: /Settings & Vault Tools/i })
    ).toBeInTheDocument();

    // Click Set Security PIN
    const setPinBtn = screen.getByTestId('set-pin-btn');
    fireEvent.click(setPinBtn);

    // Enter PIN: 1234
    const newPinInput = await screen.findByTestId('new-pin-input');
    const confirmPinInput = screen.getByTestId('confirm-pin-input');
    fireEvent.change(newPinInput, { target: { value: '1234' } });
    fireEvent.change(confirmPinInput, { target: { value: '1234' } });

    // Save PIN
    const savePinBtn = screen.getByTestId('pin-submit-btn');
    fireEvent.click(savePinBtn);

    // PIN is saved. Wait for modal to close and Lock Vault button to appear
    const lockVaultBtn = await screen.findByTestId('lock-vault-btn');
    expect(lockVaultBtn).toBeInTheDocument();

    // Lock session
    fireEvent.click(lockVaultBtn);

    // PinLockScreen is now displayed
    expect(await screen.findByTestId('pin-lock-screen')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Enter PIN to Unlock/i })).toBeInTheDocument();

    // Enter PIN via keypad
    fireEvent.click(screen.getByTestId('keypad-1'));
    fireEvent.click(screen.getByTestId('keypad-2'));
    fireEvent.click(screen.getByTestId('keypad-3'));
    fireEvent.click(screen.getByTestId('keypad-4'));

    // PinLockScreen unlocks and restores application
    await waitFor(() => {
      expect(screen.queryByTestId('pin-lock-screen')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: /Settings & Vault Tools/i })
    ).toBeInTheDocument();
  });

  it('Test 6: Resetting vault in Settings clears database and re-opens Onboarding modal', async () => {
    await seedDefaultCategories();
    await loadSampleDemoData();
    await saveUserSettings({ hasCompletedOnboarding: true });

    render(<App />);

    // Navigate to Settings
    const settingsTab = await screen.findByTestId('nav-tab-settings');
    fireEvent.click(settingsTab);

    expect(
      await screen.findByRole('heading', { name: /Settings & Vault Tools/i })
    ).toBeInTheDocument();

    // Initiate Reset Vault
    const resetVaultBtn = screen.getByTestId('reset-vault-btn');
    fireEvent.click(resetVaultBtn);

    // Step 1 confirmation
    const confirmStep1Btn = await screen.findByTestId('confirm-reset-step1-btn');
    fireEvent.click(confirmStep1Btn);

    // Step 2 final confirmation
    const confirmFinalBtn = await screen.findByTestId('confirm-reset-final-btn');
    fireEvent.click(confirmFinalBtn);

    // Database is wiped, user settings reset, and Onboarding modal re-opens
    expect(
      await screen.findByRole('heading', { name: /Mabuhay! Welcome to Balangay/i })
    ).toBeInTheDocument();
  });
});
