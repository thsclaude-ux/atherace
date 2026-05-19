import dotenv from "dotenv";
dotenv.config();
export const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3001", 10),
    host: process.env.HOST || "0.0.0.0",
    db: {
        provider: (process.env.DB_PROVIDER || "sqlite"),
        url: process.env.DATABASE_URL || "./data/at-the-race.db",
        mongoUrl: process.env.MONGODB_URL || "mongodb://localhost:27017/at-the-race",
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
        sessionSecret: process.env.SESSION_SIGNING_SECRET || "dev-session-secret-change-me",
    },
    cors: {
        origins: (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || "http://localhost:5173")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    },
    admin: {
        bootstrapSecret: process.env.BOOTSTRAP_SECRET || "",
        createSecret: process.env.CREATE_ADMIN_SECRET || "",
    },
    privacy: {
        version: process.env.PRIVACY_POLICY_VERSION || "2026-05-18",
    },
    redis: {
        url: process.env.REDIS_URL || "",
        enabled: !!process.env.REDIS_URL,
    },
    cache: {
        leaderboardTtlMs: parseInt(process.env.CACHE_LEADERBOARD_TTL_MS || "8000", 10),
    },
    isProduction: process.env.NODE_ENV === "production",
};
