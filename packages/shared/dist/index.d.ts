export declare const ROUNDS = 7;
export declare const MIN_HORSE = 1;
export declare const MAX_HORSE = 10;
export declare const CODE_LENGTH = 8;
export type UserRole = "admin" | "user";
export interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AccessCode {
    code: string;
    maxUses: number;
    usedCount: number;
    createdAt: string;
    createdBy?: string;
    expiresAt?: string;
}
export interface CodeUsage {
    userId: string;
    validatedAt: string;
    submitted: boolean;
    submittedAt?: string;
}
export interface Prediction {
    id: string;
    userId: string;
    code: string;
    rounds: number[];
    name?: string;
    phone?: string;
    submittedAt: string;
    consentAt: string;
    privacyVersion: string;
}
export interface RaceResult {
    id: string;
    rounds: number[];
    savedAt: string;
    savedBy: string;
}
export interface Participant {
    userId: string;
    name?: string;
    score: number;
    registeredAt: string;
    lastScoredAt?: string;
}
export interface LeaderboardEntry extends Participant {
    rank: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}
export interface RaceEvent {
    id: string;
    name: string;
    nameAr?: string;
    status: "draft" | "open" | "closed" | "completed";
    rounds: number;
    horsesPerRound: number;
    startsAt?: string;
    endsAt?: string;
    createdAt: string;
}
export declare function calculateScore(bets: number[], winners: number[]): number;
export declare function validateRounds(rounds: unknown[]): string | null;
export declare const PRIVACY_POLICY_VERSION = "2026-05-18";
//# sourceMappingURL=index.d.ts.map