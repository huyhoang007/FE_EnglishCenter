import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility `cn` - kết hợp clsx (conditional class) + tailwind-merge (xử lý xung đột class Tailwind).
 * Được sử dụng xuyên suốt dự án để đảm bảo className sạch và không bị ghi đè.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
