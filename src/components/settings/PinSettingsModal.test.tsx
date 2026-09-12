import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PinSettingsModal } from './PinSettingsModal';
import { SecurityContext, type SecurityContextValue } from '../../context/SecurityContext';

describe('PinSettingsModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  const mockSetPin = vi.fn();
  const mockRemovePin = vi.fn();
  const mockUnlock = vi.fn();
  const mockLock = vi.fn();
  const mockSetAutoLockMinutes = vi.fn();

  const createMockSecurityContext = (overrides?: Partial<SecurityContextValue>): SecurityContextValue => ({
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
    contextValue: SecurityContextValue = createMockSecurityContext()
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

  describe('Set PIN Mode', () => {
    it('setting a 4-digit PIN validates format and match before calling setPin', async () => {
      mockSetPin.mockResolvedValue(undefined);

      renderWithSecurity(
        <PinSettingsModal
          isOpen={true}
          mode="set"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Set Security PIN/i);

      const pinInput = screen.getByTestId('new-pin-input');
      const confirmInput = screen.getByTestId('confirm-pin-input');
      const submitBtn = screen.getByTestId('pin-submit-btn');

      // 1. Validation: Too short (< 4 digits)
      fireEvent.change(pinInput, { target: { value: '12' } });
      fireEvent.change(confirmInput, { target: { value: '12' } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId('pin-error-message')).toHaveTextContent(/PIN must be 4 to 6 digits/i);
      expect(mockSetPin).not.toHaveBeenCalled();

      // 2. Validation: Mismatched confirmation
      fireEvent.change(pinInput, { target: { value: '1234' } });
      fireEvent.change(confirmInput, { target: { value: '1235' } });
      fireEvent.click(submitBtn);

      expect(screen.getByTestId('pin-error-message')).toHaveTextContent(/PINs do not match/i);
      expect(mockSetPin).not.toHaveBeenCalled();

      // 3. Valid 4-digit match
      fireEvent.change(pinInput, { target: { value: '1234' } });
      fireEvent.change(confirmInput, { target: { value: '1234' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSetPin).toHaveBeenCalledWith('1234');
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('accepts up to 6-digit PIN successfully', async () => {
      mockSetPin.mockResolvedValue(undefined);

      renderWithSecurity(
        <PinSettingsModal
          isOpen={true}
          mode="set"
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const pinInput = screen.getByTestId('new-pin-input');
      const confirmInput = screen.getByTestId('confirm-pin-input');
      const submitBtn = screen.getByTestId('pin-submit-btn');

      fireEvent.change(pinInput, { target: { value: '987654' } });
      fireEvent.change(confirmInput, { target: { value: '987654' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSetPin).toHaveBeenCalledWith('987654');
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Remove PIN Mode', () => {
    it('removing PIN validates current PIN and calls removePin', async () => {
      mockRemovePin.mockImplementation(async (pin: string) => {
        return pin === '1234';
      });

      renderWithSecurity(
        <PinSettingsModal
          isOpen={true}
          mode="remove"
          onClose={onClose}
          onSuccess={onSuccess}
        />,
        createMockSecurityContext({ isPinSet: true })
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Disable PIN/i);

      const currentPinInput = screen.getByTestId('current-pin-input');
      const removeBtn = screen.getByTestId('pin-remove-btn');

      // 1. Incorrect current PIN
      fireEvent.change(currentPinInput, { target: { value: '0000' } });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(mockRemovePin).toHaveBeenCalledWith('0000');
        expect(screen.getByTestId('pin-error-message')).toHaveTextContent(/Incorrect current PIN/i);
        expect(onSuccess).not.toHaveBeenCalled();
      });

      // 2. Correct current PIN
      fireEvent.change(currentPinInput, { target: { value: '1234' } });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(mockRemovePin).toHaveBeenCalledWith('1234');
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Change PIN Mode', () => {
    it('changing PIN validates current PIN, checks format, and updates PIN', async () => {
      mockRemovePin.mockResolvedValue(true);
      mockSetPin.mockResolvedValue(undefined);

      renderWithSecurity(
        <PinSettingsModal
          isOpen={true}
          mode="change"
          onClose={onClose}
          onSuccess={onSuccess}
        />,
        createMockSecurityContext({ isPinSet: true })
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Change Security PIN/i);

      const currentPinInput = screen.getByTestId('current-pin-input');
      const newPinInput = screen.getByTestId('new-pin-input');
      const confirmInput = screen.getByTestId('confirm-pin-input');
      const changeBtn = screen.getByTestId('pin-change-btn');

      fireEvent.change(currentPinInput, { target: { value: '1234' } });
      fireEvent.change(newPinInput, { target: { value: '5678' } });
      fireEvent.change(confirmInput, { target: { value: '5678' } });
      fireEvent.click(changeBtn);

      await waitFor(() => {
        expect(mockRemovePin).toHaveBeenCalledWith('1234');
        expect(mockSetPin).toHaveBeenCalledWith('5678');
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  it('clicking cancel closes modal', () => {
    renderWithSecurity(
      <PinSettingsModal
        isOpen={true}
        mode="set"
        onClose={onClose}
      />
    );

    const cancelBtn = screen.getByTestId('pin-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
