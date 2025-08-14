/**
 * Contact hashing utility for privacy protection
 * Phase 4 - Privacy & Data Controls
 */

/**
 * Normalize contact identifier for consistent hashing
 */
function normalizeContact(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Simple FNV-1a hash implementation (32-bit)
 * Fallback for environments without crypto support
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Convert to unsigned 32-bit and base36
  return (hash >>> 0).toString(36);
}

/**
 * Hash a contact identifier for anonymous storage
 * Returns a deterministic, stable hash for the same input
 * 
 * @param rawContact - Raw contact identifier (email, phone, etc.)
 * @returns Hashed contact ID (max 24 chars, alphanumeric)
 */
export function hashContact(rawContact: string): string {
  if (!rawContact || typeof rawContact !== 'string') {
    throw new Error('Contact identifier must be a non-empty string');
  }

  const normalized = normalizeContact(rawContact);
  if (!normalized) {
    throw new Error('Contact identifier cannot be empty after normalization');
  }

  // Use FNV-1a hash with additional mixing for better distribution
  const hash1 = fnv1aHash(normalized);
  const hash2 = fnv1aHash(normalized + '_salt'); // Add salt for extra entropy
  
  // Combine hashes and truncate to reasonable length
  const combined = hash1 + hash2;
  return combined.substring(0, 24);
}

/**
 * Batch hash multiple contacts
 */
export function hashContacts(rawContacts: string[]): string[] {
  return rawContacts.map(hashContact);
}

/**
 * Check if a string looks like a hashed contact ID
 */
export function isHashedContact(input: string): boolean {
  return /^[a-z0-9]{12,24}$/.test(input);
}
