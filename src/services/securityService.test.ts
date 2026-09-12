import { describe, it, expect, beforeEach } from 'vitest';
import { hashPin, verifyPin, isPinConfigured } from './securityService';
import { saveUserSettings } from '../storage/settingsRepository';
import { db } from '../storage/db';

describe('securityService', () => {
  beforeEach(async () => {
    await db.settings.clear();
  });

  describe('hashPin', () => {
    it('should hash a valid 4-digit numeric PIN with salt:hexHash format', async () => {
      const hash = await hashPin('1234');
      expect(typeof hash).toBe('string');
      expect(hash).toContain(':');

      const [salt, hexHash] = hash.split(':');
      expect(salt.length).toBeGreaterThanOrEqual(16);
      expect(hexHash).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should hash a valid 6-digit numeric PIN', async () => {
      const hash = await hashPin('123456');
      expect(typeof hash).toBe('string');
      const [salt, hexHash] = hash.split(':');
      expect(salt.length).toBeGreaterThanOrEqual(16);
      expect(hexHash).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should hash a valid 5-digit numeric PIN', async () => {
      const hash = await hashPin('54321');
      expect(typeof hash).toBe('string');
      const [salt, hexHash] = hash.split(':');
      expect(salt.length).toBeGreaterThanOrEqual(16);
      expect(hexHash).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('should produce identical output when given the same salt', async () => {
      const salt = 'abcdef0123456789abcdef0123456789';
      const hash1 = await hashPin('9876', salt);
      const hash2 = await hashPin('9876', salt);
      expect(hash1).toBe(hash2);
      expect(hash1.startsWith(`${salt}:`)).toBe(true);
    });

    it('should produce different hashes for the same PIN when no salt is provided (random salts)', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).not.toBe(hash2);
    });

    it('should reject PINs shorter than 4 digits', async () => {
      await expect(hashPin('123')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
    });

    it('should reject PINs longer than 6 digits', async () => {
      await expect(hashPin('1234567')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('12345678')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
    });

    it('should reject PINs containing non-numeric characters', async () => {
      await expect(hashPin('123a')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('abcd')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('12 34')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('12-34')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
      await expect(hashPin('12.34')).rejects.toThrow(/PIN must be 4 to 6 numeric digits/i);
    });
  });

  describe('verifyPin', () => {
    it('should return true for correct PIN', async () => {
      const storedHash = await hashPin('4567');
      const isValid = await verifyPin('4567', storedHash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect PIN', async () => {
      const storedHash = await hashPin('4567');
      const isValid = await verifyPin('9999', storedHash);
      expect(isValid).toBe(false);
    });

    it('should return false for incorrect PIN of different length', async () => {
      const storedHash = await hashPin('4567');
      const isValid = await verifyPin('45678', storedHash);
      expect(isValid).toBe(false);
    });

    it('should return false if storedHash is malformed or invalid', async () => {
      expect(await verifyPin('1234', '')).toBe(false);
      expect(await verifyPin('1234', 'nosaltformat')).toBe(false);
      expect(await verifyPin('1234', 'salt:short')).toBe(false);
    });

    it('should return false if pin is empty or invalid format during verification', async () => {
      const storedHash = await hashPin('1234');
      expect(await verifyPin('abc', storedHash)).toBe(false);
      expect(await verifyPin('', storedHash)).toBe(false);
    });
  });

  describe('isPinConfigured', () => {
    it('should return false by default when no PIN is set', async () => {
      const configured = await isPinConfigured();
      expect(configured).toBe(false);
    });

    it('should return false when pinEnabled is false even if pinHash is present', async () => {
      await saveUserSettings({
        pinEnabled: false,
        pinHash: 'somesalt:somehash',
      });
      const configured = await isPinConfigured();
      expect(configured).toBe(false);
    });

    it('should return false when pinEnabled is true but pinHash is empty or undefined', async () => {
      await saveUserSettings({
        pinEnabled: true,
        pinHash: '',
      });
      const configured = await isPinConfigured();
      expect(configured).toBe(false);
    });

    it('should return true when pinEnabled is true and pinHash is present', async () => {
      await saveUserSettings({
        pinEnabled: true,
        pinHash: 'somesalt:somehash',
      });
      const configured = await isPinConfigured();
      expect(configured).toBe(true);
    });
  });
});
