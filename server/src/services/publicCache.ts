const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

export async function getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const item = cache.get(key);
  if (item && item.expiresAt > Date.now()) return item.value as T;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export function clearPublicCache(prefix?: string): void {
  if (!prefix) return cache.clear();
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
