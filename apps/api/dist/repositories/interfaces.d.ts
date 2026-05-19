import type { AccessCode, CodeUsage, Participant, Prediction, RaceResult, User } from "@atr/shared";
export interface DatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    migrate(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findPasswordHash(email: string): Promise<string | null>;
    create(data: Omit<User, "createdAt" | "updatedAt"> & {
        passwordHash: string;
    }): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User | null>;
    delete(id: string): Promise<boolean>;
    list(limit?: number, offset?: number): Promise<{
        users: User[];
        total: number;
    }>;
}
export interface RefreshTokenRepository {
    create(userId: string, tokenHash: string, expiresAt: string): Promise<void>;
    findByHash(tokenHash: string): Promise<{
        userId: string;
        expiresAt: string;
    } | null>;
    revoke(tokenHash: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
}
export interface CodeRepository {
    findByCode(code: string): Promise<AccessCode | null>;
    create(data: AccessCode): Promise<AccessCode>;
    update(code: string, data: Partial<AccessCode>): Promise<AccessCode | null>;
    delete(code: string): Promise<boolean>;
    list(): Promise<AccessCode[]>;
    getUsage(code: string, userId: string): Promise<CodeUsage | null>;
    setUsage(code: string, userId: string, usage: CodeUsage): Promise<void>;
}
export interface PredictionRepository {
    findByUserId(userId: string): Promise<Prediction | null>;
    create(data: Prediction): Promise<Prediction>;
    list(): Promise<Prediction[]>;
    deleteAll(): Promise<number>;
}
export interface ParticipantRepository {
    findByUserId(userId: string): Promise<Participant | null>;
    upsert(data: Participant): Promise<Participant>;
    listOrdered(): Promise<Participant[]>;
    updateScore(userId: string, score: number, lastScoredAt: string): Promise<void>;
    bulkUpdateScores(updates: Array<{
        userId: string;
        score: number;
    }>, lastScoredAt: string): Promise<void>;
    deleteAll(): Promise<number>;
}
export interface RaceResultRepository {
    getCurrent(): Promise<RaceResult | null>;
    save(data: RaceResult): Promise<RaceResult>;
}
export interface AuditLogRepository {
    log(action: string, userId: string | null, details: Record<string, unknown>): Promise<void>;
    list(limit?: number): Promise<Array<{
        id: string;
        action: string;
        userId: string | null;
        details: Record<string, unknown>;
        createdAt: string;
    }>>;
}
export interface Repositories {
    users: UserRepository;
    refreshTokens: RefreshTokenRepository;
    codes: CodeRepository;
    predictions: PredictionRepository;
    participants: ParticipantRepository;
    raceResults: RaceResultRepository;
    auditLogs: AuditLogRepository;
}
