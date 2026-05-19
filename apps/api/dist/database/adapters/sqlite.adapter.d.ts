import Database from "better-sqlite3";
import type { DatabaseAdapter, Repositories } from "../../repositories/interfaces.js";
export declare class SqliteAdapter implements DatabaseAdapter {
    private readonly dbPath;
    private db;
    constructor(dbPath: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    migrate(): Promise<void>;
    healthCheck(): Promise<boolean>;
    getDb(): Database.Database;
    createRepositories(): Repositories;
}
