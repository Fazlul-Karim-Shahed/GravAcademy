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

// Formats a Date into the "YYYY-MM-DDTHH:mm" string an <input type="datetime-local">
// expects, using the browser's LOCAL time fields (not UTC, unlike .toISOString()).
export function toDatetimeLocalValue(value: string | number | Date): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
