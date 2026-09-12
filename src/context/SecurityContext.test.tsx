import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SecurityProvider, useSecurity } from './SecurityContext';
import { db } from '../storage/db';
import { saveUserSettings, getUserSettings } from '../storage/settingsRepository';
import { hashPin } from '../services/securityService';

describe('SecurityContext', () => {
  beforeEach(async () => {
    await db.settings.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws error when useSecurity is called outside SecurityProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSecurity())).toThrow(
      'useSecurity must be used within a SecurityProvider'
    );
    consoleSpy.mockRestore();
  });

  it('initializes with isLocked = false when PIN is not enabled', async () => {
    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.isPinSet).toBe(false);
    expect(result.current.autoLockMinutes).toBe(0);
  });

  it('initializes with isLocked = true when PIN is enabled in settings', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
      autoLockMinutes: 5,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.isPinSet).toBe(true);
    expect(result.current.autoLockMinutes).toBe(5);
  });

  it('unlocks with valid PIN and sets isLocked = false', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isLocked).toBe(true);

    let success = false;
    await act(async () => {
      success = await result.current.unlock('1234');
    });

    expect(success).toBe(true);
    expect(result.current.isLocked).toBe(false);
  });

  it('fails to unlock with invalid PIN and keeps isLocked = true', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isLocked).toBe(true);

    let success = true;
    await act(async () => {
      success = await result.current.unlock('9999');
    });

    expect(success).toBe(false);
    expect(result.current.isLocked).toBe(true);
  });

  it('sets a new PIN, persists to settings, and marks isPinSet = true', async () => {
    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setPin('5678');
    });

    expect(result.current.isPinSet).toBe(true);
    expect(result.current.isLocked).toBe(false);

    const savedSettings = await getUserSettings();
    expect(savedSettings.pinEnabled).toBe(true);
    expect(savedSettings.pinHash).toBeDefined();

    // Verify it can now be unlocked with the new PIN after locking
    act(() => {
      result.current.lock();
    });
    expect(result.current.isLocked).toBe(true);

    let unlocked = false;
    await act(async () => {
      unlocked = await result.current.unlock('5678');
    });
    expect(unlocked).toBe(true);
    expect(result.current.isLocked).toBe(false);
  });

  it('removes PIN with valid current PIN, persists to settings, and unlocks session', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Attempt removing with wrong PIN
    let removedWrong = true;
    await act(async () => {
      removedWrong = await result.current.removePin('9999');
    });
    expect(removedWrong).toBe(false);
    expect(result.current.isPinSet).toBe(true);

    // Remove with correct PIN
    let removedCorrect = false;
    await act(async () => {
      removedCorrect = await result.current.removePin('1234');
    });
    expect(removedCorrect).toBe(true);
    expect(result.current.isPinSet).toBe(false);
    expect(result.current.isLocked).toBe(false);

    const savedSettings = await getUserSettings();
    expect(savedSettings.pinEnabled).toBe(false);
  });

  it('manually locks session when lock() is called', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.unlock('1234');
    });
    expect(result.current.isLocked).toBe(false);

    act(() => {
      result.current.lock();
    });
    expect(result.current.isLocked).toBe(true);
  });

  it('updates autoLockMinutes and persists to settings', async () => {
    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setAutoLockMinutes(15);
    });

    expect(result.current.autoLockMinutes).toBe(15);
    const saved = await getUserSettings();
    expect(saved.autoLockMinutes).toBe(15);
  });

  it('triggers auto-lock when inactivity timer expires', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
      autoLockMinutes: 1,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Switch to fake timers before unlocking so the inactivity timer is captured by fake timers
    vi.useFakeTimers();

    await act(async () => {
      await result.current.unlock('1234');
    });
    expect(result.current.isLocked).toBe(false);

    // Fast-forward less than 1 minute (50 seconds)
    act(() => {
      vi.advanceTimersByTime(50 * 1000);
    });
    expect(result.current.isLocked).toBe(false);

    // Advance remaining 10 seconds (total 60 seconds)
    act(() => {
      vi.advanceTimersByTime(10 * 1000);
    });
    expect(result.current.isLocked).toBe(true);
  });

  it('resets inactivity timer on user interaction events', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
      autoLockMinutes: 1,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.unlock('1234');
    });
    expect(result.current.isLocked).toBe(false);

    vi.useFakeTimers();

    // Advance 45 seconds
    act(() => {
      vi.advanceTimersByTime(45 * 1000);
    });
    expect(result.current.isLocked).toBe(false);

    // User activity: pointerdown
    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
    });

    // Advance another 45 seconds
    act(() => {
      vi.advanceTimersByTime(45 * 1000);
    });
    expect(result.current.isLocked).toBe(false);

    // User activity: keydown
    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });

    // Advance 45s again
    act(() => {
      vi.advanceTimersByTime(45 * 1000);
    });
    expect(result.current.isLocked).toBe(false);

    // User activity: touchstart
    act(() => {
      window.dispatchEvent(new Event('touchstart'));
    });

    // Advance 45s again
    act(() => {
      vi.advanceTimersByTime(45 * 1000);
    });
    expect(result.current.isLocked).toBe(false);

    // Now let full 60 seconds elapse without activity
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(result.current.isLocked).toBe(true);
  });

  it('does not auto-lock when autoLockMinutes is 0', async () => {
    const pinHash = await hashPin('1234');
    await saveUserSettings({
      pinEnabled: true,
      pinHash,
      autoLockMinutes: 0,
    });

    const { result } = renderHook(() => useSecurity(), {
      wrapper: ({ children }) => <SecurityProvider>{children}</SecurityProvider>,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.unlock('1234');
    });
    expect(result.current.isLocked).toBe(false);

    vi.useFakeTimers();

    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });
    expect(result.current.isLocked).toBe(false);
  });
});
