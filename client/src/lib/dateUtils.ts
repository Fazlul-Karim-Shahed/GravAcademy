// Ensures every date/time shown in the UI reflects Bangladesh Standard Time,
// regardless of the viewer's own device/browser timezone.
const BD_TIMEZONE = 'Asia/Dhaka';

export function formatBDDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString('bn-BD', { timeZone: BD_TIMEZONE, ...options });
}

export function formatBDDateTime(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleString('bn-BD', { timeZone: BD_TIMEZONE, ...options });
}

export function formatBDTime(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleTimeString('bn-BD', { timeZone: BD_TIMEZONE, ...options });
}
