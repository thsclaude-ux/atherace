import { type LeaderboardEntry, type Prediction } from "@atr/shared";
import type { Repositories } from "../repositories/interfaces.js";
import { AuthService } from "./auth.service.js";
export declare class CodeService {
    private readonly repos;
    private readonly auth;
    constructor(repos: Repositories, auth: AuthService);
    generate(maxUses: number, adminId: string): Promise<import("@atr/shared").AccessCode>;
    validate(code: string, userId: string): Promise<{
        code: string;
        sessionToken: string;
        validated: boolean;
    }>;
    list(): Promise<import("@atr/shared").AccessCode[]>;
    delete(code: string, adminId: string): Promise<void>;
}
export declare class PredictionService {
    private readonly repos;
    private readonly auth;
    constructor(repos: Repositories, auth: AuthService);
    submit(input: {
        code: string;
        userId: string;
        rounds: unknown[];
        name?: string;
        phone?: string;
        consentAccepted: boolean;
        sessionToken: string;
    }): Promise<Prediction>;
    checkSubmission(userId: string): Promise<{
        submitted: boolean;
        prediction: Prediction | null;
    }>;
}
export declare class RaceService {
    private readonly repos;
    constructor(repos: Repositories);
    saveWinners(rounds: number[], adminId: string): Promise<{
        result: import("@atr/shared").RaceResult;
        participantsUpdated: number;
    }>;
    getWinners(): Promise<import("@atr/shared").RaceResult | null>;
    getLeaderboard(includePredictions?: boolean): Promise<{
        entries: LeaderboardEntry[];
        etag: string;
    }>;
    deleteAllParticipants(adminId: string): Promise<{
        predictionsDeleted: number;
        participantsDeleted: number;
    }>;
}
export declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
