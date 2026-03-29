import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to dd/MM/yyyy (Pakistani format)
 */
export function formatDate(date: Date | string, includeTime?: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (includeTime) {
    return format(d, 'dd/MM/yyyy hh:mm a');
  }
  return format(d, 'dd/MM/yyyy');
}

/**
 * Format CNIC to xxxxx-xxxxxxx-x (Pakistani format)
 */
export function formatCnic(cnic: string): string {
  // Remove any existing dashes and non-digits
  const digits = cnic.replace(/\D/g, '');
  
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
}

/**
 * Parse formatted CNIC to raw 13 digits (for storage)
 */
export function parseCnic(formattedCnic: string): string {
  return formattedCnic.replace(/\D/g, '').slice(0, 13);
}
