type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  public set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  public invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    });
  }
}

export const memoryCache = new MemoryCache();
