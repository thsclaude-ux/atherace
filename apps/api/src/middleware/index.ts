import type { Request, Response, NextFunction } from "express";
import { AuthService, AuthError } from "../services/auth.service.js";
import { ServiceError } from "../services/race.service.js";
import type { TokenPayload } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function createAuthMiddleware(auth: AuthService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new AuthError("Authentication required", 401));
    }
    try {
      req.user = auth.verifyAccessToken(header.slice(7));
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthError("Insufficient permissions", 403));
    }
    next();
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AuthError || err instanceof ServiceError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, error: "Internal server error" });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function sanitizeString(val: unknown, maxLen = 256): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen).replace(/[<>]/g, "");
}
