import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Toast } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message when isOpen is true', () => {
    render(
      <Toast
        message="₱350 recorded in GCash"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('toast-notification')).toBeInTheDocument();
    expect(screen.getByText('₱350 recorded in GCash')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Toast
        message="Hidden toast"
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('toast-notification')).not.toBeInTheDocument();
  });

  it('auto-dismisses after durationMs', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Auto dismissing"
        isOpen={true}
        onClose={onClose}
        durationMs={3000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="Manual dismiss"
        isOpen={true}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('toast-dismiss-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders action button and triggers callback', () => {
    const onAction = vi.fn();
    const onClose = vi.fn();

    render(
      <Toast
        message="Deleted transaction"
        isOpen={true}
        onClose={onClose}
        action={{ label: 'Undo', onClick: onAction }}
      />
    );

    const actionBtn = screen.getByTestId('toast-action-btn');
    expect(actionBtn).toHaveTextContent('Undo');

    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
