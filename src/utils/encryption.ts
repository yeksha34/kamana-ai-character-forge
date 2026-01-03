
/**
 * Simple client-side encryption utility for demo purposes.
 * In a real-world app, use Web Crypto API (SubtleCrypto) for AES-GCM.
 * We use a "User Hash" derived from their ID as a rudimentary key.
 */

export async function encryptSecret(text: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Use user ID as a salt/key part for rudimentary obfuscation
  // Real implementation should derive a proper key using PBKDF2
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(userId));
  const key = new Uint8Array(hashBuffer);
  
  const encrypted = data.map((byte, i) => byte ^ key[i % key.length]);
  return btoa(String.fromCharCode(...encrypted));
}

export async function decryptSecret(base64: string, userId: string): Promise<string> {
  const binary = atob(base64);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(userId));
  const key = new Uint8Array(hashBuffer);
  
  const decrypted = data.map((byte, i) => byte ^ key[i % key.length]);
  return new TextDecoder().decode(decrypted);
}
