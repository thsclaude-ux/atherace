export declare const config: {
    readonly env: string;
    readonly port: number;
    readonly host: string;
    readonly db: {
        readonly provider: "sqlite" | "postgresql" | "mysql" | "mongodb";
        readonly url: string;
        readonly mongoUrl: string;
    };
    readonly jwt: {
        readonly accessSecret: string;
        readonly refreshSecret: string;
        readonly accessExpiresIn: string;
        readonly refreshExpiresIn: string;
        readonly sessionSecret: string;
    };
    readonly cors: {
        readonly origins: string[];
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: number;
    };
    readonly admin: {
        readonly bootstrapSecret: string;
        readonly createSecret: string;
    };
    readonly privacy: {
        readonly version: string;
    };
    readonly redis: {
        readonly url: string;
        readonly enabled: boolean;
    };
    readonly cache: {
        readonly leaderboardTtlMs: number;
    };
    readonly isProduction: boolean;
};
