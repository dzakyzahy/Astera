import crypto from 'node:crypto';

/**
 * Hashes a password using PBKDF2 with a random salt.
 * Format: salt:hash
 */
export function hashPassword(password: string): string {
  const saltBuf = crypto.randomBytes(16);
  const salt = Buffer.from(saltBuf).toString('hex');
  const hashBuf = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
  const hash = Buffer.from(hashBuf).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a previously generated hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, hash] = parts;
  const verifyHashBuf = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
  const verifyHash = Buffer.from(verifyHashBuf).toString('hex');
  return hash === verifyHash;
}
