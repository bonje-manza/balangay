import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PinLockScreen } from './PinLockScreen';

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
});

