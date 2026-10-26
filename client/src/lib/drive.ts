/**
 * Utility to convert Google Drive sharing links or raw file IDs into
 * reliable, embeddable image URLs via Google's CDN (lh3.googleusercontent.com).
 * 
 * This fixes the browser 403 Forbidden / CORS / X-Frame-Options blocking
 * that happens when embedding drive.google.com/uc?export=view or drive.google.com/file/d/...
 * directly in <img> tags.
 */
export function formatDriveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already using lh3 CDN or direct external non-drive images
  if (trimmed.includes('googleusercontent.com')) {
    return trimmed;
  }

  // Check for Drive uc?export=view&id=FILE_ID or id=FILE_ID
  const ucMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }

  // Check for Drive /file/d/FILE_ID/
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Check for Drive open?id=FILE_ID
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }

  return trimmed;
}
