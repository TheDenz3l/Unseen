/**
 * Tests for contact hashing utility
 * Phase 4 - Privacy & Data Controls
 */

import { hashContact, hashContacts, isHashedContact } from '../privacy/hash';

describe('Contact Hashing', () => {
  describe('hashContact', () => {
    test('produces stable output for same input', () => {
      const contact = 'john.doe@example.com';
      const hash1 = hashContact(contact);
      const hash2 = hashContact(contact);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });

    test('handles case insensitive inputs', () => {
      const hash1 = hashContact('John.Doe@Example.COM');
      const hash2 = hashContact('john.doe@example.com');
      
      expect(hash1).toBe(hash2);
    });

    test('normalizes whitespace', () => {
      const hash1 = hashContact('  john doe  ');
      const hash2 = hashContact('john doe');
      const hash3 = hashContact('john   doe');
      
      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    test('produces different hashes for different inputs', () => {
      const hash1 = hashContact('john@example.com');
      const hash2 = hashContact('jane@example.com');
      
      expect(hash1).not.toBe(hash2);
    });

    test('handles very long inputs without error', () => {
      const longInput = 'a'.repeat(1000) + '@example.com';
      const hash = hashContact(longInput);
      
      expect(hash.length).toBeLessThanOrEqual(24);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('returns hash within expected length', () => {
      const hash = hashContact('test@example.com');
      
      expect(hash.length).toBeLessThanOrEqual(24);
      expect(hash.length).toBeGreaterThan(10); // Should be reasonably long
    });

    test('throws error for invalid inputs', () => {
      expect(() => hashContact('')).toThrow();
      expect(() => hashContact('   ')).toThrow();
      expect(() => hashContact(null as any)).toThrow();
      expect(() => hashContact(undefined as any)).toThrow();
    });

    test('produces alphanumeric output only', () => {
      const hash = hashContact('test@example.com');
      
      expect(hash).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('hashContacts', () => {
    test('hashes multiple contacts consistently', () => {
      const contacts = ['john@example.com', 'jane@example.com'];
      const hashes1 = hashContacts(contacts);
      const hashes2 = hashContacts(contacts);
      
      expect(hashes1).toEqual(hashes2);
      expect(hashes1.length).toBe(2);
      expect(hashes1[0]).not.toBe(hashes1[1]);
    });

    test('handles empty array', () => {
      const hashes = hashContacts([]);
      expect(hashes).toEqual([]);
    });
  });

  describe('isHashedContact', () => {
    test('identifies hashed contacts correctly', () => {
      const hash = hashContact('test@example.com');
      expect(isHashedContact(hash)).toBe(true);
    });

    test('rejects non-hash strings', () => {
      expect(isHashedContact('test@example.com')).toBe(false);
      expect(isHashedContact('short')).toBe(false);
      expect(isHashedContact('has-special-chars')).toBe(false);
      expect(isHashedContact('UPPERCASE123')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(isHashedContact('')).toBe(false);
      expect(isHashedContact('a'.repeat(25))).toBe(false); // Too long
      expect(isHashedContact('a'.repeat(11))).toBe(false); // Too short
    });
  });
});
