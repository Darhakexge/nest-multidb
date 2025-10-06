import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource, ObjectLiteral, QueryRunner, Repository } from 'typeorm';
import type { DatabaseConfigMap } from './interfaces/database-config.interface';
import { DatabaseConnectionConfig } from './interfaces/database-config.interface';

@Injectable()
export class DatabaseService {
    private readonly logger = new Logger(DatabaseService.name);
    private connections: Map<string, DataSource> = new Map();
    private timeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        @Inject('DATABASE_CONFIG')
        private readonly config: DatabaseConfigMap,
    ) {}

    /**
     * Obtiene o inicializa (lazy) una conexión
     */
    async connection(name: string): Promise<DataSource> {
        if (this.connections.has(name)) return this.connections.get(name)!;

        const dbConfig = this.config[name];
        if (!dbConfig)
            throw new Error(
                `No se encontró configuración para la conexión "${name}"`,
            );

        const dataSource = await this.createDataSource(dbConfig);
        this.connections.set(name, dataSource);
        this.logger.log(`Conexión [${name}] inicializada`);

        return dataSource;
    }

    /**
     * Crea una instancia DataSource con reintentos
     */
    private async createDataSource(
        config: DatabaseConnectionConfig,
    ): Promise<DataSource> {
        const dataSource = new DataSource({
            type: config.driver,
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            charset: config.charset,
            extra: { charset: config.charset, collation: config.collation },
            synchronize: false,
            entities: [],
        });

        const maxAttempts = config.retryAttempts ?? 3;
        const delay = config.retryDelay ?? 3000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                await dataSource.initialize();
                this.scheduleAutoClose(config, dataSource);
                return dataSource;
            } catch (err) {
                this.logger.warn(
                    `Error al conectar con DB (${config.database}): intento ${i + 1}/${maxAttempts}`,
                );
                if (i === maxAttempts - 1) throw err;
                await new Promise((res) => setTimeout(res, delay));
            }
        }
        throw new Error(
            `No se pudo conectar con la base de datos ${config.database}`,
        );
    }

    /**
     * Ejecuta una consulta directa
     */
    async query(name: string, sql: string, params?: any[]): Promise<any> {
        const conn = await this.connection(name);
        this.scheduleAutoClose(this.config[name], conn);
        return conn.query(sql, params);
    }

    /**
     * Obtiene repositorio de una entidad
     */
    async getRepository<T extends ObjectLiteral>(
        name: string,
        entity: new () => T,
    ): Promise<Repository<T>> {
        const conn = await this.connection(name);
        this.scheduleAutoClose(this.config[name], conn);
        return conn.getRepository(entity);
    }

    /**
     * Ejecuta transacción
     */
    async transaction<T>(
        name: string,
        fn: (trx: QueryRunner) => Promise<T>,
    ): Promise<T> {
        const conn = await this.connection(name);
        const runner = conn.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        try {
            const result = await fn(runner);
            await runner.commitTransaction();
            return result;
        } catch (err) {
            await runner.rollbackTransaction();
            throw err;
        } finally {
            await runner.release();
        }
    }

    /**
     * Cierra conexiones inactivas automáticamente
     */
    private scheduleAutoClose(
        config: DatabaseConnectionConfig,
        dataSource: DataSource,
    ) {
        const timeoutMs = 5 * 60 * 1000; // 5 minutos
        const dbName = config.database!;
        if (this.timeouts.has(dbName)) clearTimeout(this.timeouts.get(dbName));
        this.timeouts.set(
            dbName,
            setTimeout(async () => {
                if (dataSource.isInitialized) {
                    await dataSource.destroy();
                    this.connections.delete(dbName);
                    this.logger.log(
                        `Conexión cerrada por inactividad: ${dbName}`,
                    );
                }
            }, timeoutMs),
        );
    }

    async onApplicationShutdown(signal?: string) {
        this.logger.warn(
            `Cerrando conexiones (${signal ?? 'manual shutdown'})...`,
        );
        for (const [name, conn] of this.connections) {
            if (conn.isInitialized) {
                await conn
                    .destroy()
                    .catch((err) =>
                        this.logger.error(
                            `Error cerrando conexión ${name}: ${err.message}`,
                        ),
                    );
            }
        }
        this.logger.log('Todas las conexiones cerradas.');
    }
}
