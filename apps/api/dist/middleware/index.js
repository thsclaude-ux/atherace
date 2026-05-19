import { AuthError } from "../services/auth.service.js";
import { ServiceError } from "../services/race.service.js";
export function createAuthMiddleware(auth) {
    return (req, _res, next) => {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return next(new AuthError("Authentication required", 401));
        }
        try {
            req.user = auth.verifyAccessToken(header.slice(7));
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AuthError("Insufficient permissions", 403));
        }
        next();
    };
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AuthError || err instanceof ServiceError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
}
export function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
export function sanitizeString(val, maxLen = 256) {
    if (typeof val !== "string")
        return "";
    return val.trim().slice(0, maxLen).replace(/[<>]/g, "");
}
