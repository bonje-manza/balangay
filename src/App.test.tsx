import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
