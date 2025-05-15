
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a date string in DD/MM/YYYY format to a JavaScript Date object
 * @param dateStr Date string in format DD/MM/YYYY
 * @returns JavaScript Date object or null if invalid
 */
export function parseBrazilianDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // Check if the date string matches the DD/MM/YYYY format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  
  const [_, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10) - 1; // JS months are 0-based
  const yearNum = parseInt(year, 10);
  
  // Create date and validate it's a legitimate date (not like 31/02/2025)
  const date = new Date(yearNum, monthNum, dayNum);
  if (
    date.getFullYear() !== yearNum || 
    date.getMonth() !== monthNum || 
    date.getDate() !== dayNum
  ) {
    return null; // Invalid date
  }
  
  return date;
}

/**
 * Compares two dates in DD/MM/YYYY format for sorting
 * @param dateStrA First date in DD/MM/YYYY format
 * @param dateStrB Second date in DD/MM/YYYY format
 * @returns Negative if A < B, positive if A > B, 0 if equal
 */
export function compareBrazilianDates(dateStrA: string | undefined, dateStrB: string | undefined): number {
  // Handle undefined/empty dates - push them to the end
  if (!dateStrA && !dateStrB) return 0;
  if (!dateStrA) return 1;
  if (!dateStrB) return -1;
  
  const dateA = parseBrazilianDate(dateStrA);
  const dateB = parseBrazilianDate(dateStrB);
  
  // Handle invalid dates - push them to the end
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  // Compare the valid dates
  return dateA.getTime() - dateB.getTime();
}
