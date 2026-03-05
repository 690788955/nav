import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { transliterate } from "transliteration"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTagSlug(name: string): string {
  const transliterated = transliterate(name)
  return transliterated
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
