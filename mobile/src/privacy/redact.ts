/**
 * Text redaction utility for privacy protection
 * Phase 4 - Privacy & Data Controls
 */

export interface RedactionCounts {
  emails: number;
  phones: number;
  handles: number;
  total: number;
}

export interface RedactionPreview {
  original: string;
  redacted: string;
  counts: RedactionCounts;
}

// Patterns for common PII
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
const HANDLE_PATTERN = /(?<![A-Za-z0-9._%+-])@[A-Za-z0-9_]+\b/g;

/**
 * Redact sensitive information from text
 * 
 * @param text - Input text to redact
 * @param options - Redaction options (future extensibility)
 * @returns Text with sensitive info replaced with tokens
 */
export function redactText(text: string, options?: { preserveFormat?: boolean }): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let redacted = text;
  
  // Replace emails
  redacted = redacted.replace(EMAIL_PATTERN, '[EMAIL]');
  
  // Replace phone numbers
  redacted = redacted.replace(PHONE_PATTERN, '[PHONE]');
  
  // Replace social media handles
  redacted = redacted.replace(HANDLE_PATTERN, '[HANDLE]');
  
  return redacted;
}

/**
 * Preview redactions without applying them
 * Useful for showing users what would be redacted
 */
export function previewRedactions(text: string): RedactionPreview {
  if (!text || typeof text !== 'string') {
    return {
      original: text,
      redacted: text,
      counts: { emails: 0, phones: 0, handles: 0, total: 0 }
    };
  }

  const emailMatches = text.match(EMAIL_PATTERN) || [];
  const phoneMatches = text.match(PHONE_PATTERN) || [];
  const handleMatches = text.match(HANDLE_PATTERN) || [];
  
  const counts: RedactionCounts = {
    emails: emailMatches.length,
    phones: phoneMatches.length,
    handles: handleMatches.length,
    total: emailMatches.length + phoneMatches.length + handleMatches.length
  };
  
  return {
    original: text,
    redacted: redactText(text),
    counts
  };
}

/**
 * Check if text contains potentially sensitive information
 */
export function hasSensitiveInfo(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return EMAIL_PATTERN.test(text) || 
         PHONE_PATTERN.test(text) || 
         HANDLE_PATTERN.test(text);
}
