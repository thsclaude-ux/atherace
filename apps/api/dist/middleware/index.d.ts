import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import type { TokenPayload } from "../services/auth.service.js";
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function createAuthMiddleware(auth: AuthService): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireRole(...roles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
export declare function sanitizeString(val: unknown, maxLen?: number): string;
