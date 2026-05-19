import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { initDatabase, shutdownDatabase } from "./database/index.js";
import { AuthService } from "./services/auth.service.js";
import { CodeService, PredictionService, RaceService } from "./services/race.service.js";
import { createRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/index.js";

async function main() {
  const repos = await initDatabase();
  const auth = new AuthService(repos);
  const codeService = new CodeService(repos, auth);
  const predictionService = new PredictionService(repos, auth);
  const raceService = new RaceService(repos);

  const app = express();

  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Bootstrap-Secret"],
  }));

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests" },
  }));

  app.use("/api/v1", createRoutes(auth, codeService, predictionService, raceService, repos));

  app.use(errorHandler);

  const server = app.listen(config.port, config.host, () => {
    console.log(`AT THE RACE API running on http://${config.host}:${config.port}`);
    console.log(`Environment: ${config.env} | DB: ${config.db.provider}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
    server.close();
    await shutdownDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
