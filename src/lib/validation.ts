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
 * @returns boolean indicating if the value is a positive finite number
 */
export function isPositiveNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !Number.isNaN(num) && num > 0 && Number.isFinite(num);
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value) && value > 0 && Number.isFinite(value);
  }
  return false;
}

/**
 * Validates an amount is within reasonable limits (1 to 999,999,999)
 * Prevents database overflow and UI display issues
 * @param value - The amount to validate
 * @returns boolean indicating if the value is a valid amount
 */
export function isValidAmount(value: unknown): boolean {
  const MAX_AMOUNT = 999999999;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !Number.isNaN(num) && num > 0 && num <= MAX_AMOUNT && Number.isFinite(num);
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value) && value > 0 && value <= MAX_AMOUNT && Number.isFinite(value);
  }
  return false;
}

/**
 * Validates an amount is within reasonable limits (1 to 999,999,999)
 * Prevents database overflow and UI display issues
 * @param value - The amount to validate
 * @returns { valid: boolean; error?: string } object with validation result
 */
export function validateAmount(value: unknown): { valid: boolean; error?: string } {
  const MAX_AMOUNT = 999999999;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (Number.isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  if (!Number.isFinite(num)) {
    return { valid: false, error: 'Amount is not a valid number' };
  }
  if (num > MAX_AMOUNT) {
    return { valid: false, error: `Amount cannot exceed Rs ${MAX_AMOUNT.toLocaleString()}` };
  }
  return { valid: true };
}
