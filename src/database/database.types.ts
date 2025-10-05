export type SupportedDBType = 'mysql' | 'postgres';

export interface EnvDbConfig {
  id: string; // IDENTIFICADOR, ejemplo: APP1, ANALYTICS
  type: SupportedDBType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}
