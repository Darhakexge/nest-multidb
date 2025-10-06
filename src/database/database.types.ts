// src/database/database.types.ts
export type SupportedDriver = 'mysql' | 'postgres';

export interface ConnectionConfig {
    driver: SupportedDriver;
    url?: string; // optional full connection url
    host?: string;
    port?: number | string;
    database?: string;
    username?: string;
    password?: string;
    charset?: string; // mysql
    collation?: string; // mysql
    retryAttempts?: number;
    retryDelayMs?: number;
    idleTimeoutMs?: number; // ms to auto-close when idle (0 = never)
}
