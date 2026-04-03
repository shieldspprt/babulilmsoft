/**
 * XSS sanitization utilities for ilmsoft
 * Prevents injection attacks when rendering user-generated content
 */

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Escapes dangerous HTML characters and strips script tags.
 * @param html - Raw HTML string from user input
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Sanitizes plain text for safe display.
 * Escapes HTML entities to prevent accidental rendering as HTML.
 * @param text - Raw text string from user input
 * @returns Escaped text string
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Validates and sanitizes a URL to prevent javascript: injection
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:')) {
    return '';
  }
  
  return url.trim();
}
