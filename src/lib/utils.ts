import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transforms a Google Drive URL to a direct image URL that can be displayed.
 * Handles various Google Drive URL formats and returns the original URL if not a Google Drive link.
 */
export function transformImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Check if it's a Google Drive URL
  const drivePatterns = [
    // https://drive.google.com/file/d/FILE_ID/view
    /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    // https://drive.google.com/open?id=FILE_ID
    /https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    // https://drive.google.com/uc?id=FILE_ID
    /https?:\/\/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    // https://drive.google.com/thumbnail?id=FILE_ID
    /https?:\/\/drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return the direct image URL using Google's thumbnail API with a large size
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }
  
  // Not a Google Drive URL, return as-is
  return url;
}
