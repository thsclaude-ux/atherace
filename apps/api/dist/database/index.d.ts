import type { Repositories } from "../repositories/interfaces.js";
export declare function initDatabase(): Promise<Repositories>;
export declare function getRepositories(): Repositories;
export declare function shutdownDatabase(): Promise<void>;
export declare function healthCheck(): Promise<boolean>;
