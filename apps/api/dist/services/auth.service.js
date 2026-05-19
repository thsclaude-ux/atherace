import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { v4 as uuid } from "uuid";
import { config } from "../config/index.js";
export class AuthService {
    repos;
    constructor(repos) {
        this.repos = repos;
    }
    async register(email, password, role = "user", name) {
        const existing = await this.repos.users.findByEmail(email);
        if (existing)
            throw new AuthError("Email already registered", 409);
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.repos.users.create({
            id: uuid(),
            email,
            passwordHash,
            role,
            name,
        });
        const tokens = await this.issueTokens(user);
        await this.repos.auditLogs.log("user.register", user.id, { email });
        return { user, tokens };
    }
    async login(email, password) {
        const row = await this.repos.users.findByEmail(email);
        if (!row)
            throw new AuthError("Invalid credentials", 401);
        const passwordHash = await this.repos.users.findPasswordHash(row.email);
        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            throw new AuthError("Invalid credentials", 401);
        }
        const tokens = await this.issueTokens(row);
        await this.repos.auditLogs.log("user.login", row.id, { email });
        return { user: row, tokens };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
        }
        catch {
            throw new AuthError("Invalid refresh token", 401);
        }
        const hash = hashToken(refreshToken);
        const stored = await this.repos.refreshTokens.findByHash(hash);
        if (!stored || stored.userId !== payload.sub) {
            throw new AuthError("Refresh token revoked", 401);
        }
        if (new Date(stored.expiresAt) < new Date()) {
            throw new AuthError("Refresh token expired", 401);
        }
        const user = await this.repos.users.findById(payload.sub);
        if (!user)
            throw new AuthError("User not found", 401);
        await this.repos.refreshTokens.revoke(hash);
        return this.issueTokens(user);
    }
    async logout(refreshToken) {
        const hash = hashToken(refreshToken);
        await this.repos.refreshTokens.revoke(hash);
    }
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, config.jwt.accessSecret);
        }
        catch {
            throw new AuthError("Invalid or expired token", 401);
        }
    }
    issueSessionToken(userId, code) {
        return jwt.sign({ userId, code }, config.jwt.sessionSecret, { expiresIn: "24h" });
    }
    verifySessionToken(token) {
        try {
            return jwt.verify(token, config.jwt.sessionSecret);
        }
        catch {
            throw new AuthError("Invalid session", 403);
        }
    }
    async issueTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await this.repos.refreshTokens.create(user.id, hashToken(refreshToken), expiresAt);
        return { accessToken, refreshToken, expiresIn: 900 };
    }
}
export class AuthError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AuthError";
    }
}
export function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
export function generateCode(length = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = randomBytes(length);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
