import { Router } from "express";
import { asyncHandler, createAuthMiddleware, requireRole, sanitizeString } from "../middleware/index.js";
import { z } from "zod";
import * as XLSX from "xlsx";
import { config } from "../config/index.js";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const generateCodeSchema = z.object({ maxUses: z.number().int().min(1).max(10000).default(1) });
const submitSchema = z.object({
    code: z.string().min(4),
    userId: z.string().min(1).max(128),
    rounds: z.array(z.number()).length(7),
    name: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
    consentAccepted: z.literal(true),
    sessionToken: z.string(),
});
const winnersSchema = z.object({ rounds: z.array(z.number()).length(7) });
export function createRoutes(auth, codeService, predictionService, raceService, repos) {
    const router = Router();
    const authenticate = createAuthMiddleware(auth);
    const adminOnly = [authenticate, requireRole("admin")];
    // ── Health ──
    router.get("/health", asyncHandler(async (_req, res) => {
        const { healthCheck } = await import("../database/index.js");
        const dbOk = await healthCheck();
        res.json({ success: true, data: { status: dbOk ? "healthy" : "degraded", timestamp: new Date().toISOString() } });
    }));
    // ── Auth ──
    router.post("/auth/login", asyncHandler(async (req, res) => {
        const body = loginSchema.parse(req.body);
        const result = await auth.login(body.email, body.password);
        res.json({ success: true, data: result });
    }));
    router.post("/auth/refresh", asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ success: false, error: "Refresh token required" });
            return;
        }
        const tokens = await auth.refresh(refreshToken);
        res.json({ success: true, data: tokens });
    }));
    router.post("/auth/logout", asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        if (refreshToken)
            await auth.logout(refreshToken);
        res.json({ success: true });
    }));
    router.post("/auth/bootstrap", asyncHandler(async (req, res) => {
        const secret = req.headers["x-bootstrap-secret"];
        if (!secret || secret !== config.admin.bootstrapSecret) {
            res.status(403).json({ success: false, error: "Forbidden" });
            return;
        }
        const { email, password, name } = req.body;
        const existing = await repos.users.findByEmail(email);
        if (existing) {
            res.status(409).json({ success: false, error: "Admin already exists" });
            return;
        }
        const result = await auth.register(email, password, "admin", name);
        res.status(201).json({ success: true, data: { user: result.user } });
    }));
    // ── Codes ──
    router.post("/codes", ...adminOnly, asyncHandler(async (req, res) => {
        const body = generateCodeSchema.parse(req.body);
        const code = await codeService.generate(body.maxUses, req.user.sub);
        res.status(201).json({ success: true, data: code });
    }));
    router.get("/codes", ...adminOnly, asyncHandler(async (_req, res) => {
        const codes = await codeService.list();
        res.json({ success: true, data: codes });
    }));
    router.delete("/codes/:code", ...adminOnly, asyncHandler(async (req, res) => {
        const code = String(req.params.code);
        await codeService.delete(code, req.user.sub);
        res.json({ success: true });
    }));
    router.get("/codes/validate", asyncHandler(async (req, res) => {
        const code = sanitizeString(req.query.code);
        const userId = sanitizeString(req.query.userId, 128);
        if (!code || !userId) {
            res.status(400).json({ success: false, error: "code and userId required" });
            return;
        }
        const result = await codeService.validate(code, userId);
        res.json({ success: true, data: result });
    }));
    // ── Predictions ──
    router.post("/predictions", asyncHandler(async (req, res) => {
        const body = submitSchema.parse(req.body);
        const token = req.headers.authorization?.slice(7) || body.sessionToken;
        const prediction = await predictionService.submit({ ...body, sessionToken: token });
        res.status(201).json({ success: true, data: prediction });
    }));
    router.get("/predictions/status", asyncHandler(async (req, res) => {
        const userId = sanitizeString(req.query.userId, 128);
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const status = await predictionService.checkSubmission(userId);
        res.json({ success: true, data: status });
    }));
    // ── Race ──
    router.post("/race/winners", ...adminOnly, asyncHandler(async (req, res) => {
        const body = winnersSchema.parse(req.body);
        const result = await raceService.saveWinners(body.rounds, req.user.sub);
        res.json({ success: true, data: result });
    }));
    router.get("/race/winners", asyncHandler(async (_req, res) => {
        const winners = await raceService.getWinners();
        res.json({ success: true, data: winners });
    }));
    router.get("/leaderboard", asyncHandler(async (req, res) => {
        const includePredictions = !!req.user?.role && req.user.role === "admin";
        const authHeader = req.headers.authorization;
        let admin = includePredictions;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const payload = auth.verifyAccessToken(authHeader.slice(7));
                admin = payload.role === "admin";
            }
            catch { /* public leaderboard */ }
        }
        const ifNoneMatch = req.headers["if-none-match"];
        const { entries, etag } = await raceService.getLeaderboard(admin);
        res.setHeader("ETag", `"${etag}"`);
        res.setHeader("Cache-Control", "private, max-age=5");
        if (ifNoneMatch === `"${etag}"`) {
            res.status(304).end();
            return;
        }
        res.json({ success: true, data: entries });
    }));
    router.delete("/participants", ...adminOnly, asyncHandler(async (req, res) => {
        const result = await raceService.deleteAllParticipants(req.user.sub);
        res.json({ success: true, data: result });
    }));
    // ── Export ──
    router.get("/export/participants", ...adminOnly, asyncHandler(async (_req, res) => {
        const { entries } = await raceService.getLeaderboard(true);
        const predictions = await repos.predictions.list();
        const predMap = new Map(predictions.map((p) => [p.userId, p]));
        const rows = entries.map((e) => {
            const pred = predMap.get(e.userId);
            const row = {
                Rank: e.rank,
                Name: e.name || "",
                Score: e.score,
                Registered: e.registeredAt,
            };
            if (pred) {
                pred.rounds.forEach((r, i) => { row[`Round ${i + 1}`] = r; });
            }
            return row;
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=leaderboard.xlsx");
        res.send(buf);
    }));
    // ── Users (Admin) ──
    router.get("/users", ...adminOnly, asyncHandler(async (req, res) => {
        const page = parseInt(String(req.query.page || "1"), 10);
        const limit = parseInt(String(req.query.limit || "50"), 10);
        const result = await repos.users.list(limit, (page - 1) * limit);
        res.json({ success: true, data: result.users, total: result.total, page, limit });
    }));
    // ── Audit ──
    router.get("/audit", ...adminOnly, asyncHandler(async (_req, res) => {
        const logs = await repos.auditLogs.list();
        res.json({ success: true, data: logs });
    }));
    return router;
}
