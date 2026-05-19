import { createHash } from "crypto";
export class CacheService {
    store = new Map();
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return { data: entry.data, etag: entry.etag };
    }
    set(key, data, ttlMs) {
        const etag = createHash("md5").update(JSON.stringify(data)).digest("hex");
        this.store.set(key, { data, etag, expiresAt: Date.now() + ttlMs });
        return etag;
    }
    invalidate(keyOrPattern) {
        if (!keyOrPattern.includes("*")) {
            this.store.delete(keyOrPattern);
            return;
        }
        const prefix = keyOrPattern.replace("*", "");
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix))
                this.store.delete(key);
        }
    }
    invalidateAll() {
        this.store.clear();
    }
}
export const cache = new CacheService();
export const CACHE_KEYS = {
    leaderboard: (admin) => `leaderboard:${admin ? "admin" : "public"}`,
    leaderboardPattern: "leaderboard:",
};
