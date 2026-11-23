import type { Metadata } from 'next';

export const SITE_URL = 'https://gravacademy.com';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://gravapi.138.2.92.182.nip.io/api/v1').replace(/\/$/, '');

export function cleanText(value?: string, fallback = 'গ্র্যাভ একাডেমি — ক্লাস ৬ থেকে ১২ পর্যন্ত মানসম্মত অনলাইন একাডেমিক কেয়ার।'): string {
  if (!value) return fallback;
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text || fallback;
}

export async function publicApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export function pageMetadata({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  const url = new URL(path, SITE_URL).toString();
  return {
    title,
    description: cleanText(description),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'bn_BD',
      url,
      siteName: 'GRAV ACADEMY',
      title,
      description: cleanText(description),
      images: [{ url: image || `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description: cleanText(description), images: [image || `${SITE_URL}/opengraph-image`] },
  };
}
