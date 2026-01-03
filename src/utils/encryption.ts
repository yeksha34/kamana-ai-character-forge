
/**
 * Advanced client-side encryption utility using the Web Crypto API.
 * Uses AES-GCM for authenticated encryption and PBKDF2 for secure key derivation.
 * Keys are derived from the User ID and a fixed application salt.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // Standard for AES-GCM
const SALT = 'kamana-forge-vault-v1-salt';
const ITERATIONS = 100000;

/**
 * Derives a deterministic 256-bit AES key from the user's ID.
 */
async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string and returns a base64 encoded string containing [IV][Ciphertext + Tag].
 */
export async function encryptSecret(text: string, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(text);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData
  );

  // Combine IV and Encrypted content (Ciphertext + Auth Tag)
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Browser-compatible binary to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 string using the user's derived key.
 */
export async function decryptSecret(base64: string, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  
  // Base64 to Uint8Array
  const combined = new Uint8Array(
    atob(base64)
      .split('')
      .map((char) => char.charCodeAt(0))
  );

  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed. Key rotation or user mismatch suspected.', err);
    throw new Error('Failed to decrypt vaulted secret.');
  }
}
