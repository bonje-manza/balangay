import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PinLockScreen } from './PinLockScreen';
import * as backupService from '../../services/backupService';
import * as settingsRepo from '../../storage/settingsRepository';

describe('PinLockScreen Component', () => {
  it('renders keypad and dot indicators', () => {
    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);

    expect(screen.getByText(/Enter PIN to Unlock/i)).toBeInTheDocument();

    // 4 dot indicators
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`pin-dot-${i}`)).toBeInTheDocument();
      expect(screen.getByTestId(`pin-dot-${i}`)).toHaveAttribute('data-filled', 'false');
    }

    // Keypad digits 0-9
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByTestId(`keypad-${i}`)).toBeInTheDocument();
    }

    // Clear and Backspace keys
    expect(screen.getByTestId('keypad-clear')).toBeInTheDocument();
    expect(screen.getByTestId('keypad-backspace')).toBeInTheDocument();
  });

  it('updates dot indicators when entering digits', () => {
    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);

    fireEvent.click(screen.getByTestId('keypad-1'));
    expect(screen.getByTestId('pin-dot-0')).toHaveAttribute('data-filled', 'true');
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'false');

    fireEvent.click(screen.getByTestId('keypad-2'));
    expect(screen.getByTestId('pin-dot-0')).toHaveAttribute('data-filled', 'true');
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'true');
    expect(screen.getByTestId('pin-dot-2')).toHaveAttribute('data-filled', 'false');
  });

  it('removes last digit when backspace is pressed', () => {
    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);

    fireEvent.click(screen.getByTestId('keypad-3'));
    fireEvent.click(screen.getByTestId('keypad-4'));
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'true');

    fireEvent.click(screen.getByTestId('keypad-backspace'));
    expect(screen.getByTestId('pin-dot-0')).toHaveAttribute('data-filled', 'true');
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'false');
  });

  it('resets all digits when clear is pressed', () => {
    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);

    fireEvent.click(screen.getByTestId('keypad-5'));
    fireEvent.click(screen.getByTestId('keypad-6'));
    expect(screen.getByTestId('pin-dot-0')).toHaveAttribute('data-filled', 'true');
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'true');

    fireEvent.click(screen.getByTestId('keypad-clear'));
    expect(screen.getByTestId('pin-dot-0')).toHaveAttribute('data-filled', 'false');
    expect(screen.getByTestId('pin-dot-1')).toHaveAttribute('data-filled', 'false');
  });

  it('calls unlock with entered PIN and displays error feedback on failed verification', async () => {
    const mockUnlock = vi.fn().mockResolvedValue(false);
    render(<PinLockScreen pinLength={4} unlock={mockUnlock} />);

    // Enter 4 digits: 1 2 3 4
    fireEvent.click(screen.getByTestId('keypad-1'));
    fireEvent.click(screen.getByTestId('keypad-2'));
    fireEvent.click(screen.getByTestId('keypad-3'));
    fireEvent.click(screen.getByTestId('keypad-4'));

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalledWith('1234');
    });

    // Error feedback should be displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback when verification succeeds', async () => {
    const mockUnlock = vi.fn().mockResolvedValue(true);
    const mockSuccess = vi.fn();
    render(<PinLockScreen pinLength={4} unlock={mockUnlock} onSuccess={mockSuccess} />);

    fireEvent.click(screen.getByTestId('keypad-9'));
    fireEvent.click(screen.getByTestId('keypad-8'));
    fireEvent.click(screen.getByTestId('keypad-7'));
    fireEvent.click(screen.getByTestId('keypad-6'));

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalledWith('9876');
      expect(mockSuccess).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses SecurityContext when unlock prop is not provided', async () => {
    const mockUnlock = vi.fn().mockResolvedValue(true);
    const mockContextValue: any = {
      isLocked: true,
      isPinSet: true,
      autoLockMinutes: 0,
      isLoading: false,
      unlock: mockUnlock,
      setPin: vi.fn(),
      removePin: vi.fn(),
      lock: vi.fn(),
      setAutoLockMinutes: vi.fn(),
    };

    const { SecurityContext } = await import('../../context/SecurityContext');

    render(
      <SecurityContext.Provider value={mockContextValue}>
        <PinLockScreen pinLength={4} />
      </SecurityContext.Provider>
    );

    fireEvent.click(screen.getByTestId('keypad-1'));
    fireEvent.click(screen.getByTestId('keypad-2'));
    fireEvent.click(screen.getByTestId('keypad-3'));
    fireEvent.click(screen.getByTestId('keypad-4'));

    await waitFor(() => {
      expect(mockUnlock).toHaveBeenCalledWith('1234');
    });
  });

  it('renders emergency restore button and opens emergency modal', () => {
    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);

    const forgotBtn = screen.getByTestId('forgot-pin-btn');
    expect(forgotBtn).toBeInTheDocument();
    expect(forgotBtn).toHaveTextContent(/Forgot PIN\? Restore from backup file/i);

    fireEvent.click(forgotBtn);
    expect(screen.getByText('Emergency Vault Restore')).toBeInTheDocument();
    expect(screen.getByTestId('emergency-restore-input')).toBeInTheDocument();
  });

  it('handles emergency restore error on invalid file', async () => {
    vi.spyOn(backupService, 'importFullDatabaseJSON').mockRejectedValueOnce(
      new Error('Invalid JSON format: Unable to parse backup payload')
    );

    render(<PinLockScreen pinLength={4} unlock={vi.fn()} />);
    fireEvent.click(screen.getByTestId('forgot-pin-btn'));

    const file = new File(['not valid json'], 'corrupt.json', { type: 'application/json' });
    const input = screen.getByTestId('emergency-restore-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Invalid JSON format/i);
      expect(alert).toHaveClass('text-rose-600');
    });
  });

  it('handles emergency restore success on valid backup file', async () => {
    const importSpy = vi.spyOn(backupService, 'importFullDatabaseJSON').mockResolvedValueOnce({
      success: true,
      summary: { accounts: 1, transactions: 1, categories: 1, settings: 1 },
    });
    const saveSettingsSpy = vi.spyOn(settingsRepo, 'saveUserSettings').mockResolvedValueOnce();
    const mockSuccess = vi.fn();
    const mockEmergencySuccess = vi.fn();

    render(
      <PinLockScreen
        pinLength={4}
        unlock={vi.fn()}
        onSuccess={mockSuccess}
        onEmergencyRestore={mockEmergencySuccess}
      />
    );

    fireEvent.click(screen.getByTestId('forgot-pin-btn'));

    const validJson = JSON.stringify({ version: 1, appName: 'Balangay Finance Tracker', data: {} });
    const file = new File([validJson], 'backup.json', { type: 'application/json' });
    const input = screen.getByTestId('emergency-restore-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(validJson);
      expect(saveSettingsSpy).toHaveBeenCalledWith({
        pinEnabled: false,
        pinHash: undefined,
      });
      expect(mockEmergencySuccess).toHaveBeenCalledTimes(1);
      expect(mockSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

