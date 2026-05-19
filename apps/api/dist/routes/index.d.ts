import type { AuthService } from "../services/auth.service.js";
import type { CodeService, PredictionService, RaceService } from "../services/race.service.js";
import type { Repositories } from "../repositories/interfaces.js";
export declare function createRoutes(auth: AuthService, codeService: CodeService, predictionService: PredictionService, raceService: RaceService, repos: Repositories): import("express-serve-static-core").Router;
