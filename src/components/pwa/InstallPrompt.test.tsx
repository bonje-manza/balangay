import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';

describe('InstallPrompt Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('does not render banner initially when beforeinstallprompt event has not fired', () => {
    render(<InstallPrompt />);
    expect(
      screen.queryByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).not.toBeInTheDocument();
  });

  it('renders warm neo-brutalist banner when beforeinstallprompt event is dispatched', async () => {
    render(<InstallPrompt />);

    const mockPromptEvent = new Event('beforeinstallprompt');
    Object.assign(mockPromptEvent, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    expect(
      screen.getByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss|close/i })).toBeInTheDocument();
  });

  it('calls prompt() and hides banner when Install App is clicked', async () => {
    const onInstallMock = vi.fn();
    render(<InstallPrompt onInstall={onInstallMock} />);

    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const mockPromptEvent = new Event('beforeinstallprompt');
    Object.assign(mockPromptEvent, {
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    const installButton = screen.getByRole('button', { name: /install app/i });
    await act(async () => {
      fireEvent.click(installButton);
    });

    expect(promptSpy).toHaveBeenCalled();
    expect(onInstallMock).toHaveBeenCalled();
    expect(
      screen.queryByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).not.toBeInTheDocument();
  });

  it('dismisses banner and persists dismissal in sessionStorage when dismiss button clicked', () => {
    const onDismissMock = vi.fn();
    render(<InstallPrompt onDismiss={onDismissMock} />);

    const mockPromptEvent = new Event('beforeinstallprompt');
    Object.assign(mockPromptEvent, {
      prompt: vi.fn(),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
    fireEvent.click(dismissButton);

    expect(onDismissMock).toHaveBeenCalled();
    expect(sessionStorage.getItem('balangay_install_dismissed')).toBe('true');
    expect(
      screen.queryByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).not.toBeInTheDocument();
  });

  it('does not display if previously dismissed in sessionStorage', () => {
    sessionStorage.setItem('balangay_install_dismissed', 'true');
    render(<InstallPrompt />);

    const mockPromptEvent = new Event('beforeinstallprompt');
    Object.assign(mockPromptEvent, {
      prompt: vi.fn(),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockPromptEvent);
    });

    expect(
      screen.queryByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).not.toBeInTheDocument();
  });

  it('renders when forceShow is true and not dismissed', () => {
    render(<InstallPrompt forceShow={true} />);
    expect(
      screen.getByText(/Install Balangay locally on your device for instant 100% offline access/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
  });
});
