import { config } from "../config/index.js";
import { SqliteAdapter } from "./adapters/sqlite.adapter.js";
import type { DatabaseAdapter, Repositories } from "../repositories/interfaces.js";

let adapter: DatabaseAdapter | null = null;
let repos: Repositories | null = null;

export async function initDatabase(): Promise<Repositories> {
  if (repos) return repos;

  switch (config.db.provider) {
    case "sqlite":
    default:
      adapter = new SqliteAdapter(config.db.url);
      break;
    // postgresql, mysql, mongodb adapters can be added here
  }

  await adapter.connect();
  await adapter.migrate();

  if (adapter instanceof SqliteAdapter) {
    repos = adapter.createRepositories();
  } else {
    throw new Error(`Unsupported database provider: ${config.db.provider}`);
  }

  return repos as Repositories;
}

export function getRepositories(): Repositories {
  if (!repos) throw new Error("Database not initialized. Call initDatabase() first.");
  return repos;
}

export async function shutdownDatabase(): Promise<void> {
  if (adapter) await adapter.disconnect();
  adapter = null;
  repos = null;
}

export async function healthCheck(): Promise<boolean> {
  if (!adapter) return false;
  return adapter.healthCheck();
}
