import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsView } from './SettingsView';
import { SecurityContext, type SecurityContextValue } from '../../context/SecurityContext';
import * as backupService from '../../services/backupService';
import * as seedData from '../../storage/seedData';
import * as dbModule from '../../storage/db';
import * as settingsRepo from '../../storage/settingsRepository';

describe('SettingsView Component (TDD)', () => {
  const mockLock = vi.fn();
  const mockSetPin = vi.fn();
  const mockRemovePin = vi.fn();
  const mockUnlock = vi.fn();
  const mockSetAutoLockMinutes = vi.fn();
  const onDataReset = vi.fn();
  const onDataLoaded = vi.fn();

  const createSecurityValue = (overrides?: Partial<SecurityContextValue>): SecurityContextValue => ({
    isLocked: false,
    isPinSet: false,
    autoLockMinutes: 0,
    isLoading: false,
    unlock: mockUnlock,
    setPin: mockSetPin,
    removePin: mockRemovePin,
    lock: mockLock,
    setAutoLockMinutes: mockSetAutoLockMinutes,
    ...overrides,
  });

  const renderWithSecurity = (
    ui: React.ReactElement,
    contextValue: SecurityContextValue = createSecurityValue()
  ) => {
    return render(
      <SecurityContext.Provider value={contextValue}>
        {ui}
      </SecurityContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 bento sections with live security status and currency', () => {
    renderWithSecurity(<SettingsView />);

    // Header in Fraunces serif
    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toHaveTextContent(/Settings & Vault Tools/i);

    // Bento 1: Localization & Currency
    expect(screen.getByText(/Localization & Currency/i)).toBeInTheDocument();
    expect(screen.getByText(/Philippine Peso \(PHP\)/i)).toBeInTheDocument();
    expect(screen.getByText('₱')).toBeInTheDocument();
    expect(screen.getByText(/en-PH/i)).toBeInTheDocument();

    // Bento 2: Privacy & Security (Disabled status badge by default)
    expect(screen.getByText(/Privacy & PIN Security/i)).toBeInTheDocument();
    const pinBadge = screen.getByTestId('pin-status-badge');
    expect(pinBadge).toHaveTextContent(/Disabled/i);
    expect(screen.getByTestId('set-pin-btn')).toBeInTheDocument();
    expect(screen.getByTestId('autolock-select')).toBeInTheDocument();

    // Bento 3: Backup & Portability
    expect(screen.getByText(/Backup & Portability/i)).toBeInTheDocument();
    expect(screen.getByTestId('export-backup-btn')).toBeInTheDocument();
    expect(screen.getByTestId('open-restore-modal-btn')).toBeInTheDocument();
    expect(screen.getByTestId('open-csv-modal-btn')).toBeInTheDocument();

    // Bento 4: Data Management & Demo Mode
    expect(screen.getByText(/Data Management & Demo/i)).toBeInTheDocument();
    expect(screen.getByTestId('load-demo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('reset-vault-btn')).toBeInTheDocument();
  });

  it('renders Protected badge and allows Lock Vault Now when PIN is configured', () => {
    renderWithSecurity(
      <SettingsView />,
      createSecurityValue({ isPinSet: true, autoLockMinutes: 5 })
    );

    const pinBadge = screen.getByTestId('pin-status-badge');
    expect(pinBadge).toHaveTextContent(/Protected/i);

    expect(screen.getByTestId('change-pin-btn')).toBeInTheDocument();
    expect(screen.getByTestId('disable-pin-btn')).toBeInTheDocument();

    const lockBtn = screen.getByTestId('lock-vault-btn');
    expect(lockBtn).toBeInTheDocument();
    fireEvent.click(lockBtn);

    expect(mockLock).toHaveBeenCalledTimes(1);
  });

  it('updating auto-lock dropdown calls setAutoLockMinutes', async () => {
    renderWithSecurity(<SettingsView />);

    const select = screen.getByTestId('autolock-select');
    fireEvent.change(select, { target: { value: '15' } });

    expect(mockSetAutoLockMinutes).toHaveBeenCalledWith(15);
  });

  it('clicking "Export Full JSON Backup" calls exportFullDatabaseJSON and triggers download', async () => {
    const fakeJson = JSON.stringify({ version: 1, appName: 'Balangay Finance Tracker' });
    const exportSpy = vi.spyOn(backupService, 'exportFullDatabaseJSON').mockResolvedValue(fakeJson);

    // Mock link click & createObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/fake-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithSecurity(<SettingsView />);

    const exportBtn = screen.getByTestId('export-backup-btn');
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(linkClickSpy).toHaveBeenCalled();
    });

    linkClickSpy.mockRestore();
  });

  it('clicking "Load Sample Demo Data" triggers demo generator after confirmation prompt', async () => {
    const loadDemoSpy = vi.spyOn(seedData, 'loadSampleDemoData').mockResolvedValue();

    renderWithSecurity(<SettingsView onDataLoaded={onDataLoaded} />);

    const loadDemoBtn = screen.getByTestId('load-demo-btn');
    fireEvent.click(loadDemoBtn);

    // Confirmation prompt appears
    expect(screen.getByTestId('confirm-load-demo-prompt')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-load-demo-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(loadDemoSpy).toHaveBeenCalled();
      expect(onDataLoaded).toHaveBeenCalled();
      expect(screen.getByTestId('demo-loaded-banner')).toBeInTheDocument();
    });
  });

  it('clicking "Reset Entire Vault" prompts for double confirmation and executes reset', async () => {
    const resetDbSpy = vi.spyOn(dbModule, 'resetDatabase').mockResolvedValue();
    const saveSettingsSpy = vi.spyOn(settingsRepo, 'saveUserSettings').mockResolvedValue();

    renderWithSecurity(<SettingsView onDataReset={onDataReset} />);

    const resetBtn = screen.getByTestId('reset-vault-btn');
    fireEvent.click(resetBtn);

    // Step 1 confirmation
    expect(screen.getByTestId('reset-step1-prompt')).toBeInTheDocument();
    const step1Btn = screen.getByTestId('confirm-reset-step1-btn');
    fireEvent.click(step1Btn);

    // Step 2 (Double confirmation)
    expect(screen.getByTestId('reset-step2-prompt')).toBeInTheDocument();
    const finalResetBtn = screen.getByTestId('confirm-reset-final-btn');
    fireEvent.click(finalResetBtn);

    await waitFor(() => {
      expect(resetDbSpy).toHaveBeenCalled();
      expect(saveSettingsSpy).toHaveBeenCalledWith({
        hasCompletedOnboarding: false,
        pinEnabled: false,
        pinHash: undefined,
        autoLockMinutes: 0,
      });
      expect(onDataReset).toHaveBeenCalled();
    });
  });

  it('opens modals when respective buttons are clicked', () => {
    renderWithSecurity(<SettingsView />);

    // 1. Open BackupModal
    fireEvent.click(screen.getByTestId('open-restore-modal-btn'));
    expect(screen.getByRole('heading', { level: 2, name: /Restore Backup/i })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('backup-cancel-btn'));

    // 2. Open CsvImportModal
    fireEvent.click(screen.getByTestId('open-csv-modal-btn'));
    expect(screen.getByRole('heading', { level: 2, name: /Import Statement \(CSV\)/i })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('csv-cancel-btn'));

    // 3. Open PinSettingsModal
    fireEvent.click(screen.getByTestId('set-pin-btn'));
    expect(screen.getByRole('heading', { level: 2, name: /Set Security PIN/i })).toBeInTheDocument();
  });
});
