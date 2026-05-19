import { config } from "../config/index.js";
import { SqliteAdapter } from "./adapters/sqlite.adapter.js";
let adapter = null;
let repos = null;
export async function initDatabase() {
    if (repos)
        return repos;
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
    }
    else {
        throw new Error(`Unsupported database provider: ${config.db.provider}`);
    }
    return repos;
}
export function getRepositories() {
    if (!repos)
        throw new Error("Database not initialized. Call initDatabase() first.");
    return repos;
}
export async function shutdownDatabase() {
    if (adapter)
        await adapter.disconnect();
    adapter = null;
    repos = null;
}
export async function healthCheck() {
    if (!adapter)
        return false;
    return adapter.healthCheck();
}
