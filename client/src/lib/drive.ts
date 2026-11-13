/**
 * Utility to convert Google Drive sharing links, direct IDs, or CDN URLs into
 * reliable, embeddable image URLs via Google's direct CDN (lh3.googleusercontent.com/d/ID).
 */
export function formatDriveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. If already an lh3.googleusercontent.com/d/FILE_ID, return as-is
  if (trimmed.includes('lh3.googleusercontent.com/d/')) {
    return trimmed;
  }

  // 2. If it's a googleusercontent.com link with an ID in the path (/d/ID)
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return `https://lh3.googleusercontent.com/d/${lh3Match[1]}`;
  }

  // 3. Check for Drive uc?export=view&id=FILE_ID or id=FILE_ID
  const ucMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }

  // 4. Check for Drive /file/d/FILE_ID/
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // 5. Check for Drive open?id=FILE_ID
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }

  // 6. Check for Drive folders/files with /d/FILE_ID
  const genericDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (genericDMatch && genericDMatch[1] && genericDMatch[1].length >= 20) {
    return `https://lh3.googleusercontent.com/d/${genericDMatch[1]}`;
  }

  return trimmed;
}

/** Convert a Google Drive file link into the URL intended for an embedded preview. */
export function getDrivePreviewUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1] && trimmed.includes('drive.google.com')) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  return trimmed;
}
