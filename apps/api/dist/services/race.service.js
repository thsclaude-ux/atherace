import { v4 as uuid } from "uuid";
import { calculateScore, CODE_LENGTH, PRIVACY_POLICY_VERSION, validateRounds, } from "@atr/shared";
import { generateCode } from "./auth.service.js";
import { cache, CACHE_KEYS } from "./cache.service.js";
import { config } from "../config/index.js";
export class CodeService {
    repos;
    auth;
    constructor(repos, auth) {
        this.repos = repos;
        this.auth = auth;
    }
    async generate(maxUses, adminId) {
        const code = generateCode(CODE_LENGTH);
        const created = await this.repos.codes.create({
            code,
            maxUses,
            usedCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: adminId,
        });
        await this.repos.auditLogs.log("code.generate", adminId, { code, maxUses });
        return created;
    }
    async validate(code, userId) {
        const normalized = code.toUpperCase().trim();
        const record = await this.repos.codes.findByCode(normalized);
        if (!record)
            throw new ServiceError("Code not found", 404);
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
            throw new ServiceError("Code expired", 410);
        }
        const existing = await this.repos.codes.getUsage(normalized, userId);
        if (existing?.submitted) {
            throw new ServiceError("Already submitted for this code", 409);
        }
        if (!existing) {
            if (record.usedCount >= record.maxUses) {
                throw new ServiceError("Code usage limit reached", 403);
            }
            const validatedAt = new Date().toISOString();
            await this.repos.codes.setUsage(normalized, userId, { userId, validatedAt, submitted: false });
            await this.repos.codes.update(normalized, { usedCount: record.usedCount + 1 });
        }
        const sessionToken = this.auth.issueSessionToken(userId, normalized);
        return { code: normalized, sessionToken, validated: true };
    }
    async list() {
        return this.repos.codes.list();
    }
    async delete(code, adminId) {
        const ok = await this.repos.codes.delete(code.toUpperCase());
        if (!ok)
            throw new ServiceError("Code not found", 404);
        await this.repos.auditLogs.log("code.delete", adminId, { code });
    }
}
export class PredictionService {
    repos;
    auth;
    constructor(repos, auth) {
        this.repos = repos;
        this.auth = auth;
    }
    async submit(input) {
        const session = this.auth.verifySessionToken(input.sessionToken);
        if (session.userId !== input.userId || session.code !== input.code.toUpperCase()) {
            throw new ServiceError("Invalid session", 403);
        }
        if (!input.consentAccepted)
            throw new ServiceError("Consent required", 400);
        const roundError = validateRounds(input.rounds);
        if (roundError)
            throw new ServiceError(roundError, 400);
        const code = input.code.toUpperCase();
        const existing = await this.repos.predictions.findByUserId(input.userId);
        if (existing)
            throw new ServiceError("Already submitted", 409);
        const usage = await this.repos.codes.getUsage(code, input.userId);
        if (!usage?.validatedAt)
            throw new ServiceError("Validate code first", 403);
        if (usage.submitted)
            throw new ServiceError("Already submitted for this code", 409);
        const submittedAt = new Date().toISOString();
        const prediction = await this.repos.predictions.create({
            id: uuid(),
            userId: input.userId,
            code,
            rounds: input.rounds,
            name: input.name?.slice(0, 80),
            phone: input.phone?.slice(0, 20),
            submittedAt,
            consentAt: submittedAt,
            privacyVersion: PRIVACY_POLICY_VERSION,
        });
        await this.repos.codes.setUsage(code, input.userId, {
            ...usage,
            submitted: true,
            submittedAt,
        });
        await this.repos.participants.upsert({
            userId: input.userId,
            name: input.name || input.phone,
            score: 0,
            registeredAt: submittedAt,
        });
        cache.invalidate(CACHE_KEYS.leaderboardPattern);
        return prediction;
    }
    async checkSubmission(userId) {
        const pred = await this.repos.predictions.findByUserId(userId);
        return { submitted: !!pred, prediction: pred };
    }
}
export class RaceService {
    repos;
    constructor(repos) {
        this.repos = repos;
    }
    async saveWinners(rounds, adminId) {
        const err = validateRounds(rounds);
        if (err)
            throw new ServiceError(err, 400);
        const savedAt = new Date().toISOString();
        const result = await this.repos.raceResults.save({
            id: "current",
            rounds,
            savedAt,
            savedBy: adminId,
        });
        const predictions = await this.repos.predictions.list();
        const scoreUpdates = predictions.map((pred) => ({
            userId: pred.userId,
            score: calculateScore(pred.rounds, rounds),
        }));
        if (scoreUpdates.length > 0) {
            await this.repos.participants.bulkUpdateScores(scoreUpdates, savedAt);
        }
        cache.invalidate(CACHE_KEYS.leaderboardPattern);
        await this.repos.auditLogs.log("race.saveWinners", adminId, { rounds });
        return { result, participantsUpdated: predictions.length };
    }
    async getWinners() {
        return this.repos.raceResults.getCurrent();
    }
    async getLeaderboard(includePredictions = false) {
        const cacheKey = CACHE_KEYS.leaderboard(includePredictions);
        const cached = cache.get(cacheKey);
        if (cached)
            return { entries: cached.data, etag: cached.etag };
        const participants = await this.repos.participants.listOrdered();
        let entries = participants.map((p, i) => ({ ...p, rank: i + 1 }));
        if (includePredictions) {
            const predictions = await this.repos.predictions.list();
            const predMap = new Map(predictions.map((p) => [p.userId, p]));
            entries = entries.map((e) => ({
                ...e,
                ...(predMap.has(e.userId) ? { prediction: predMap.get(e.userId) } : {}),
            }));
        }
        const etag = cache.set(cacheKey, entries, config.cache.leaderboardTtlMs);
        return { entries, etag };
    }
    async deleteAllParticipants(adminId) {
        const predCount = await this.repos.predictions.deleteAll();
        const partCount = await this.repos.participants.deleteAll();
        cache.invalidate(CACHE_KEYS.leaderboardPattern);
        await this.repos.auditLogs.log("participants.deleteAll", adminId, { predCount, partCount });
        return { predictionsDeleted: predCount, participantsDeleted: partCount };
    }
}
export class ServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ServiceError";
    }
}
