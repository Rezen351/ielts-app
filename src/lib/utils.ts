import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Standard Shadcn/ui helper for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Band conversion logic
export const convertRawToBand = (score: number, mod: 'listening' | 'reading', type: 'Academic' | 'General' = 'Academic'): number => {
  if (mod === 'listening') {
    if (score >= 39) return 9.0;
    if (score >= 37) return 8.5;
    if (score >= 35) return 8.0;
    if (score >= 32) return 7.5;
    if (score >= 30) return 7.0;
    if (score >= 26) return 6.5;
    if (score >= 23) return 6.0;
    if (score >= 18) return 5.5;
    if (score >= 16) return 5.0;
    if (score >= 13) return 4.5;
    if (score >= 10) return 4.0;
    return 3.5;
  } else {
    // Reading Academic
    if (type === 'Academic') {
      if (score >= 39) return 9.0;
      if (score >= 37) return 8.5;
      if (score >= 35) return 8.0;
      if (score >= 33) return 7.5;
      if (score >= 30) return 7.0;
      if (score >= 27) return 6.5;
      if (score >= 23) return 6.0;
      if (score >= 19) return 5.5;
      if (score >= 15) return 5.0;
      if (score >= 13) return 4.5;
      if (score >= 10) return 4.0;
      return 3.5;
    } else {
      // Reading General
      if (score >= 40) return 9.0;
      if (score >= 39) return 8.5;
      if (score >= 37) return 8.0;
      if (score >= 36) return 7.5;
      if (score >= 34) return 7.0;
      if (score >= 32) return 6.5;
      if (score >= 30) return 6.0;
      if (score >= 27) return 5.5;
      if (score >= 23) return 5.0;
      if (score >= 19) return 4.5;
      if (score >= 15) return 4.0;
      return 3.5;
    }
  }
};
