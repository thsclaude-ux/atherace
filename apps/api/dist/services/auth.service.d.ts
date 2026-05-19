import type { Repositories } from "../repositories/interfaces.js";
import type { AuthTokens, User, UserRole } from "@atr/shared";
export interface TokenPayload {
    sub: string;
    email: string;
    role: UserRole;
}
export interface SessionPayload {
    userId: string;
    code: string;
}
export declare class AuthService {
    private readonly repos;
    constructor(repos: Repositories);
    register(email: string, password: string, role?: UserRole, name?: string): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    login(email: string, password: string): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
    verifyAccessToken(token: string): TokenPayload;
    issueSessionToken(userId: string, code: string): string;
    verifySessionToken(token: string): SessionPayload;
    private issueTokens;
}
export declare class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare function hashToken(token: string): string;
export declare function generateCode(length?: number): string;
