import { createHash } from "crypto";

interface CacheEntry<T> {
  data: T;
  etag: string;
  expiresAt: number;
}

export class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): { data: T; etag: string } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return { data: entry.data as T, etag: entry.etag };
  }

  set<T>(key: string, data: T, ttlMs: number): string {
    const etag = createHash("md5").update(JSON.stringify(data)).digest("hex");
    this.store.set(key, { data, etag, expiresAt: Date.now() + ttlMs });
    return etag;
  }

  invalidate(keyOrPattern: string): void {
    if (!keyOrPattern.includes("*")) {
      this.store.delete(keyOrPattern);
      return;
    }
    const prefix = keyOrPattern.replace("*", "");
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  invalidateAll(): void {
    this.store.clear();
  }
}

export const cache = new CacheService();

export const CACHE_KEYS = {
  leaderboard: (admin: boolean) => `leaderboard:${admin ? "admin" : "public"}`,
  leaderboardPattern: "leaderboard:",
} as const;
