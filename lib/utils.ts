import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { transliterate } from "transliteration"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTagSlug(name: string): string {
  // Transliterate Chinese to pinyin, then normalize
  const transliterated = transliterate(name)
  
  // Convert to lowercase, replace spaces with hyphens, remove special characters
  return transliterated
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
