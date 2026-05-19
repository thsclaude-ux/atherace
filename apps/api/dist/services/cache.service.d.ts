export declare class CacheService {
    private store;
    get<T>(key: string): {
        data: T;
        etag: string;
    } | null;
    set<T>(key: string, data: T, ttlMs: number): string;
    invalidate(keyOrPattern: string): void;
    invalidateAll(): void;
}
export declare const cache: CacheService;
export declare const CACHE_KEYS: {
    readonly leaderboard: (admin: boolean) => string;
    readonly leaderboardPattern: "leaderboard:";
};
