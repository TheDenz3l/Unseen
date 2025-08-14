/**
 * Tests for text redaction utility  
 * Phase 4 - Privacy & Data Controls
 */

import { redactText, previewRedactions, hasSensitiveInfo } from '../privacy/redact';

describe('Text Redaction', () => {
  describe('redactText', () => {
    test('redacts email addresses', () => {
      const text = 'Contact me at john.doe@example.com for more info';
      const redacted = redactText(text);
      
      expect(redacted).toBe('Contact me at [EMAIL] for more info');
    });

    test('redacts phone numbers', () => {
      const text = 'Call me at (555) 123-4567 or 555.987.6543';
      const redacted = redactText(text);
      
      expect(redacted).toBe('Call me at [PHONE] or [PHONE]');
    });

    test('redacts social media handles', () => {
      const text = 'Follow me @johndoe on Twitter and @jane_doe too';
      const redacted = redactText(text);
      
      expect(redacted).toBe('Follow me [HANDLE] on Twitter and [HANDLE] too');
    });

    test('redacts multiple types together', () => {
      const text = 'Email john@example.com or call (555) 123-4567, also follow @johndoe';
      const redacted = redactText(text);
      
      expect(redacted).toBe('Email [EMAIL] or call [PHONE], also follow [HANDLE]');
    });

    test('handles text with no sensitive info', () => {
      const text = 'This is just regular text with no PII';
      const redacted = redactText(text);
      
      expect(redacted).toBe(text);
    });

    test('handles empty and invalid inputs', () => {
      expect(redactText('')).toBe('');
      expect(redactText(null as any)).toBe(null);
      expect(redactText(undefined as any)).toBe(undefined);
    });

    test('is idempotent', () => {
      const text = 'Email john@example.com please';
      const redacted1 = redactText(text);
      const redacted2 = redactText(redacted1);
      
      expect(redacted1).toBe(redacted2);
    });
  });

  describe('previewRedactions', () => {
    test('provides accurate counts', () => {
      const text = 'Email john@example.com or jane@test.org, call (555) 123-4567, follow @johndoe';
      const preview = previewRedactions(text);
      
      expect(preview.counts.emails).toBe(2);
      expect(preview.counts.phones).toBe(1);
      expect(preview.counts.handles).toBe(1);
      expect(preview.counts.total).toBe(4);
      expect(preview.original).toBe(text);
      expect(preview.redacted).toBe('Email [EMAIL] or [EMAIL], call [PHONE], follow [HANDLE]');
    });

    test('handles text with no sensitive info', () => {
      const text = 'Just regular text';
      const preview = previewRedactions(text);
      
      expect(preview.counts.total).toBe(0);
      expect(preview.original).toBe(text);
      expect(preview.redacted).toBe(text);
    });

    test('handles empty input', () => {
      const preview = previewRedactions('');
      
      expect(preview.counts.total).toBe(0);
      expect(preview.original).toBe('');
      expect(preview.redacted).toBe('');
    });
  });

  describe('hasSensitiveInfo', () => {
    test('detects emails', () => {
      expect(hasSensitiveInfo('Contact john@example.com')).toBe(true);
    });

    test('detects phone numbers', () => {
      expect(hasSensitiveInfo('Call (555) 123-4567')).toBe(true);
    });

    test('detects handles', () => {
      expect(hasSensitiveInfo('Follow @johndoe')).toBe(true);
    });

    test('returns false for clean text', () => {
      expect(hasSensitiveInfo('Just regular text')).toBe(false);
    });

    test('handles empty/invalid input', () => {
      expect(hasSensitiveInfo('')).toBe(false);
      expect(hasSensitiveInfo(null as any)).toBe(false);
      expect(hasSensitiveInfo(undefined as any)).toBe(false);
    });
  });
});
