import { getUserSettings } from '../storage/settingsRepository';

const PIN_REGEX = /^\d{4,6}$/;

/**
 * Validates that the given PIN consists of 4 to 6 numeric digits.
 */
export function isValidPinFormat(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

/**
 * Generates a cryptographically random 16-byte salt as a hex string.
 */
function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compares two strings in constant time to mitigate timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hashes a 4-to-6 digit numeric PIN with a salt using Web Crypto SHA-256.
 * Returns the format `salt:hexHash`.
 */
export async function hashPin(pin: string, salt?: string): Promise<string> {
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN must be 4 to 6 numeric digits');
  }

  const actualSalt = salt ?? generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${actualSalt}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hexHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${actualSalt}:${hexHash}`;
}

/**
 * Verifies a PIN against a stored `salt:hexHash` string in constant time.
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!isValidPinFormat(pin) || !storedHash || !storedHash.includes(':')) {
    return false;
  }

  const colonIndex = storedHash.indexOf(':');
  const salt = storedHash.slice(0, colonIndex);
  const expectedHex = storedHash.slice(colonIndex + 1);

  if (!salt || !expectedHex || expectedHex.length !== 64) {
    return false;
  }

  try {
    const computed = await hashPin(pin, salt);
    const computedHex = computed.slice(colonIndex + 1);
    return timingSafeEqual(computedHex.toLowerCase(), expectedHex.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Checks whether PIN protection is configured and enabled in user settings.
 */
export async function isPinConfigured(): Promise<boolean> {
  const settings = await getUserSettings();
  return Boolean(settings.pinEnabled && settings.pinHash && settings.pinHash.trim().length > 0);
}
