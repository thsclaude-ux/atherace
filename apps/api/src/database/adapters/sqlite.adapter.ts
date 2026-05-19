import Database from "better-sqlite3";
import { v4 as uuid } from "uuid";
import type {
  AccessCode,
  CodeUsage,
  Participant,
  Prediction,
  RaceResult,
  User,
} from "@atr/shared";
import { SCHEMA_SQL } from "../schema.sql.js";
import type {
  AuditLogRepository,
  CodeRepository,
  DatabaseAdapter,
  ParticipantRepository,
  PredictionRepository,
  RaceResultRepository,
  RefreshTokenRepository,
  Repositories,
  UserRepository,
} from "../../repositories/interfaces.js";
import { mkdirSync } from "fs";
import { dirname } from "path";

function parseJson<T>(val: string): T {
  return JSON.parse(val) as T;
}

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(private readonly dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  async connect(): Promise<void> {
    /* already connected */
  }

  async disconnect(): Promise<void> {
    this.db.close();
  }

  async migrate(): Promise<void> {
    this.db.exec(SCHEMA_SQL);
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.db.prepare("SELECT 1").get();
      return true;
    } catch {
      return false;
    }
  }

  getDb(): Database.Database {
    return this.db;
  }

  createRepositories(): Repositories {
    const db = this.db;

    const users: UserRepository = {
      async findById(id) {
        const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, string> | undefined;
        return row ? mapUser(row) : null;
      },
      async findByEmail(email) {
        const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, string> | undefined;
        return row ? mapUser(row) : null;
      },
      async findPasswordHash(email) {
        const row = db.prepare("SELECT password_hash FROM users WHERE email = ?").get(email) as { password_hash: string } | undefined;
        return row?.password_hash ?? null;
      },
      async create(data) {
        const now = new Date().toISOString();
        db.prepare(
          "INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).run(data.id, data.email, data.passwordHash, data.role, data.name ?? null, now, now);
        return (await users.findById(data.id))!;
      },
      async update(id, data) {
        const existing = await users.findById(id);
        if (!existing) return null;
        const now = new Date().toISOString();
        db.prepare("UPDATE users SET email = ?, role = ?, name = ?, updated_at = ? WHERE id = ?").run(
          data.email ?? existing.email,
          data.role ?? existing.role,
          data.name ?? existing.name ?? null,
          now,
          id
        );
        return users.findById(id);
      },
      async delete(id) {
        const r = db.prepare("DELETE FROM users WHERE id = ?").run(id);
        return r.changes > 0;
      },
      async list(limit = 50, offset = 0) {
        const total = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
        const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as Record<string, string>[];
        return { users: rows.map(mapUser), total };
      },
    };

    const refreshTokens: RefreshTokenRepository = {
      async create(userId, tokenHash, expiresAt) {
        db.prepare("INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").run(
          uuid(), userId, tokenHash, expiresAt, new Date().toISOString()
        );
      },
      async findByHash(tokenHash) {
        const row = db.prepare("SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = ?").get(tokenHash) as Record<string, string> | undefined;
        return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
      },
      async revoke(tokenHash) {
        db.prepare("DELETE FROM refresh_tokens WHERE token_hash = ?").run(tokenHash);
      },
      async revokeAllForUser(userId) {
        db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(userId);
      },
    };

    const codes: CodeRepository = {
      async findByCode(code) {
        const row = db.prepare("SELECT * FROM access_codes WHERE code = ?").get(code) as Record<string, unknown> | undefined;
        return row ? mapCode(row) : null;
      },
      async create(data) {
        db.prepare("INSERT INTO access_codes (code, max_uses, used_count, created_at, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)").run(
          data.code, data.maxUses, data.usedCount, data.createdAt, data.createdBy ?? null, data.expiresAt ?? null
        );
        return (await codes.findByCode(data.code))!;
      },
      async update(code, data) {
        const existing = await codes.findByCode(code);
        if (!existing) return null;
        db.prepare("UPDATE access_codes SET max_uses = ?, used_count = ?, expires_at = ? WHERE code = ?").run(
          data.maxUses ?? existing.maxUses,
          data.usedCount ?? existing.usedCount,
          data.expiresAt ?? existing.expiresAt ?? null,
          code
        );
        return codes.findByCode(code);
      },
      async delete(code) {
        return db.prepare("DELETE FROM access_codes WHERE code = ?").run(code).changes > 0;
      },
      async list() {
        const rows = db.prepare("SELECT * FROM access_codes ORDER BY created_at DESC").all() as Record<string, unknown>[];
        return rows.map(mapCode);
      },
      async getUsage(code, userId) {
        const row = db.prepare("SELECT * FROM code_usages WHERE code = ? AND user_id = ?").get(code, userId) as Record<string, unknown> | undefined;
        return row ? mapUsage(row) : null;
      },
      async setUsage(code, userId, usage) {
        db.prepare(
          "INSERT OR REPLACE INTO code_usages (code, user_id, validated_at, submitted, submitted_at) VALUES (?, ?, ?, ?, ?)"
        ).run(code, userId, usage.validatedAt, usage.submitted ? 1 : 0, usage.submittedAt ?? null);
      },
    };

    const predictions: PredictionRepository = {
      async findByUserId(userId) {
        const row = db.prepare("SELECT * FROM predictions WHERE user_id = ?").get(userId) as Record<string, string> | undefined;
        return row ? mapPrediction(row) : null;
      },
      async create(data) {
        db.prepare(
          "INSERT INTO predictions (id, user_id, code, rounds, name, phone, submitted_at, consent_at, privacy_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(data.id, data.userId, data.code, JSON.stringify(data.rounds), data.name ?? null, data.phone ?? null, data.submittedAt, data.consentAt, data.privacyVersion);
        return (await predictions.findByUserId(data.userId))!;
      },
      async list() {
        const rows = db.prepare("SELECT * FROM predictions ORDER BY submitted_at DESC").all() as Record<string, string>[];
        return rows.map(mapPrediction);
      },
      async deleteAll() {
        return db.prepare("DELETE FROM predictions").run().changes;
      },
    };

    const participants: ParticipantRepository = {
      async findByUserId(userId) {
        const row = db.prepare("SELECT * FROM participants WHERE user_id = ?").get(userId) as Record<string, string> | undefined;
        return row ? mapParticipant(row) : null;
      },
      async upsert(data) {
        db.prepare(
          "INSERT OR REPLACE INTO participants (user_id, name, score, registered_at, last_scored_at) VALUES (?, ?, ?, ?, ?)"
        ).run(data.userId, data.name ?? null, data.score, data.registeredAt, data.lastScoredAt ?? null);
        return (await participants.findByUserId(data.userId))!;
      },
      async listOrdered() {
        const rows = db.prepare("SELECT * FROM participants ORDER BY score DESC, registered_at ASC").all() as Record<string, string>[];
        return rows.map(mapParticipant);
      },
      async updateScore(userId, score, lastScoredAt) {
        db.prepare("UPDATE participants SET score = ?, last_scored_at = ? WHERE user_id = ?").run(score, lastScoredAt, userId);
      },
      async bulkUpdateScores(updates, lastScoredAt) {
        const tx = db.transaction((rows: Array<{ userId: string; score: number }>) => {
          const stmt = db.prepare("UPDATE participants SET score = ?, last_scored_at = ? WHERE user_id = ?");
          for (const row of rows) {
            stmt.run(row.score, lastScoredAt, row.userId);
          }
        });
        tx(updates);
      },
      async deleteAll() {
        return db.prepare("DELETE FROM participants").run().changes;
      },
    };

    const raceResults: RaceResultRepository = {
      async getCurrent() {
        const row = db.prepare("SELECT * FROM race_results WHERE id = 'current'").get() as Record<string, string> | undefined;
        return row ? mapRaceResult(row) : null;
      },
      async save(data) {
        db.prepare(
          "INSERT OR REPLACE INTO race_results (id, rounds, saved_at, saved_by) VALUES ('current', ?, ?, ?)"
        ).run(JSON.stringify(data.rounds), data.savedAt, data.savedBy);
        return (await raceResults.getCurrent())!;
      },
    };

    const auditLogs: AuditLogRepository = {
      async log(action, userId, details) {
        db.prepare("INSERT INTO audit_logs (id, action, user_id, details, created_at) VALUES (?, ?, ?, ?, ?)").run(
          uuid(), action, userId, JSON.stringify(details), new Date().toISOString()
        );
      },
      async list(limit = 100) {
        const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit) as Record<string, string>[];
        return rows.map((r) => ({
          id: r.id,
          action: r.action,
          userId: r.user_id,
          details: parseJson(r.details),
          createdAt: r.created_at,
        }));
      },
    };

    return { users, refreshTokens, codes, predictions, participants, raceResults, auditLogs };
  }
}

function mapUser(row: Record<string, string>): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as User["role"],
    name: row.name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCode(row: Record<string, unknown>): AccessCode {
  return {
    code: row.code as string,
    maxUses: row.max_uses as number,
    usedCount: row.used_count as number,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string) ?? undefined,
    expiresAt: (row.expires_at as string) ?? undefined,
  };
}

function mapUsage(row: Record<string, unknown>): CodeUsage {
  return {
    userId: row.user_id as string,
    validatedAt: row.validated_at as string,
    submitted: !!(row.submitted as number),
    submittedAt: (row.submitted_at as string) ?? undefined,
  };
}

function mapPrediction(row: Record<string, string>): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    rounds: parseJson<number[]>(row.rounds),
    name: row.name ?? undefined,
    phone: row.phone ?? undefined,
    submittedAt: row.submitted_at,
    consentAt: row.consent_at,
    privacyVersion: row.privacy_version,
  };
}

function mapParticipant(row: Record<string, string>): Participant {
  return {
    userId: row.user_id,
    name: row.name ?? undefined,
    score: row.score as unknown as number,
    registeredAt: row.registered_at,
    lastScoredAt: row.last_scored_at ?? undefined,
  };
}

function mapRaceResult(row: Record<string, string>): RaceResult {
  return {
    id: row.id,
    rounds: parseJson<number[]>(row.rounds),
    savedAt: row.saved_at,
    savedBy: row.saved_by,
  };
}
