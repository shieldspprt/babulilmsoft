/**
 * Shared validation utilities for ilmsoft
 */

/**
 * Validates Pakistani CNIC format: XXXXX-XXXXXXX-X
 * @param cnic - The CNIC string to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidCNIC(cnic: string): boolean {
  if (!cnic) return true; // Optional field - empty is valid
  const cnicRegex = /^\d{5}-\d{7}-\d$/;
  return cnicRegex.test(cnic);
}

/**
 * Validates a phone number format (Pakistani mobile: 03XX-XXXXXXX)
 * @param phone - The phone number to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Pakistani mobile format: starts with 03, followed by 9 more digits
  // Accepts formats: 03XX-XXXXXXX or 03XXXXXXXXX
  const phoneRegex = /^03\d{2}-?\d{7}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates email format
 * @param email - The email to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a string is not empty after trimming
 * @param value - The string to validate
 * @returns boolean indicating if the string has content
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.trim().length > 0;
}

/**
 * Validates a positive number
 * @param value - The number to validate
 * @returns boolean indicating if the value is a positive number
 */
export function isPositiveNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !Number.isNaN(num) && num > 0;
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value) && value > 0;
  }
  return false;
}
