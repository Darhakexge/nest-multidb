export interface DatabaseConnectionConfig {
    driver: 'mysql' | 'postgres';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    charset?: string;
    collation?: string;
    retryAttempts?: number;
    retryDelay?: number;
}

export type DatabaseConfigMap = Record<string, DatabaseConnectionConfig>;
