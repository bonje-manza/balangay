import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal content with title and children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Add Transaction" subtitle="Enter details">
        <div>Form Content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByText('Enter details')).toBeInTheDocument();
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Closeable Modal">
        Content
      </Modal>
    );

    const closeBtn = screen.getByLabelText(/close modal/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop scrim', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Backdrop Modal">
        Content
      </Modal>
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Modal">
        Content
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the modal and restores focus on close', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('data-testid', 'trigger-btn');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Modal">
        <input data-testid="first-input" />
        <button data-testid="second-button">Submit</button>
      </Modal>
    );

    const closeBtn = screen.getByLabelText(/close modal/i);
    const firstInput = screen.getByTestId('first-input');
    const secondBtn = screen.getByTestId('second-button');

    // Initially focused on first focusable element (close button in header)
    expect(document.activeElement).toBe(closeBtn);

    // Tab from close button to first input
    fireEvent.keyDown(window, { key: 'Tab' });
    firstInput.focus();

    // Tab to last element
    fireEvent.keyDown(window, { key: 'Tab' });
    secondBtn.focus();

    // Tab from last element wraps around to first element (closeBtn)
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps around to last element (secondBtn)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(secondBtn);

    // On unmount/close, focus returns to trigger
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
