import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { v4 as uuid } from "uuid";
import { config } from "../config/index.js";
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

export class AuthService {
  constructor(private readonly repos: Repositories) {}

  async register(email: string, password: string, role: UserRole = "user", name?: string): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.repos.users.findByEmail(email);
    if (existing) throw new AuthError("Email already registered", 409);

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

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const row = await this.repos.users.findByEmail(email);
    if (!row) throw new AuthError("Invalid credentials", 401);

    const passwordHash = await this.repos.users.findPasswordHash(row.email);
    if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
      throw new AuthError("Invalid credentials", 401);
    }

    const tokens = await this.issueTokens(row);
    await this.repos.auditLogs.log("user.login", row.id, { email });
    return { user: row, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
    } catch {
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
    if (!user) throw new AuthError("User not found", 401);

    await this.repos.refreshTokens.revoke(hash);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = hashToken(refreshToken);
    await this.repos.refreshTokens.revoke(hash);
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    } catch {
      throw new AuthError("Invalid or expired token", 401);
    }
  }

  issueSessionToken(userId: string, code: string): string {
    return jwt.sign({ userId, code } satisfies SessionPayload, config.jwt.sessionSecret, { expiresIn: "24h" });
  }

  verifySessionToken(token: string): SessionPayload {
    try {
      return jwt.verify(token, config.jwt.sessionSecret) as SessionPayload;
    } catch {
      throw new AuthError("Invalid session", 403);
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"] });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.repos.refreshTokens.create(user.id, hashToken(refreshToken), expiresAt);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
