import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DataSource, DataSourceOptions, ObjectLiteral } from 'typeorm';
import { EnvDbConfig } from './database.types';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly dataSources = new Map<string, DataSource>();

  /**
   * Inicializa las conexiones a partir de configuraciones ya parseadas y validadas.
   * Este método se invoca desde el módulo en el momento de arranque.
   */
  public async init(confs: EnvDbConfig[]) {
    // Init each data source with retries
    await Promise.all(
      confs.map((cfg) =>
        this.initializeDataSource(cfg).catch((err) => {
          this.logger.error(
            `Failed to initialize dataSource ${cfg.id}: ${err?.message ?? err}`,
          );
          throw err;
        }),
      ),
    );
  }

  private buildDataSourceOptions(cfg: EnvDbConfig): DataSourceOptions {
    const common = {
      type: cfg.type,
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      database: cfg.database,
    } as DataSourceOptions;

    // We don't register entities by default to allow raw queries and on-demand repositories.
    // But we can add common options.
    const base: DataSourceOptions = {
      ...common,
      // disable logging by default; adjust as needed
      logging: false,
      // synchronize disabled by default in production. The user should set separately if needed.
      synchronize: false,
      // no entities by default; repos can be requested dynamically
      entities: [],
    };

    // Drivers-specific options could be added if required
    return base;
  }

  private async initializeDataSource(cfg: EnvDbConfig): Promise<void> {
    const name = cfg.id;
    if (this.dataSources.has(name)) {
      this.logger.log(`DataSource ${name} already initialized, skipping.`);
      return;
    }

    const options = this.buildDataSourceOptions(cfg);
    // Create DataSource and attempt to initialize
    const ds = new DataSource(options);

    const attempts = cfg.retryAttempts ?? 3;
    const delayMs = cfg.retryDelayMs ?? 1000;

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        this.logger.log(
          `Initializing DataSource ${name}: attempt ${attempt}/${attempts}`,
        );
        await ds.initialize();
        this.dataSources.set(name, ds);
        this.logger.log(`DataSource ${name} initialized successfully.`);
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `DataSource ${name} init attempt ${attempt} failed: ${err?.message ?? err}`,
        );
        if (attempt < attempts) {
          await this.sleep(delayMs);
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    throw new Error(
      `Unable to initialize DataSource ${name} after ${attempts} attempts. Last error: ${String(lastError)}`,
    );
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene una DataSource por su id.
   * Lanza error si no existe o no está inicializada.
   */
  public getDataSource(id: string): DataSource {
    const ds = this.dataSources.get(id);
    if (!ds) {
      throw new Error(
        `DataSource with id "${id}" not found or not initialized.`,
      );
    }
    if (!ds.isInitialized) {
      throw new Error(`DataSource "${id}" is not initialized.`);
    }
    return ds;
  }

  /**
   * Ejecuta una consulta preparada (raw SQL) en la base de datos indicada.
   * @param databaseId identificador DB (ej. APP1, ANALYTICS)
   * @param sql consulta SQL con placeholders
   * @param params bindings array
   */
  public async query(
    databaseId: string,
    sql: string,
    params?: any[],
  ): Promise<any> {
    const ds = this.getDataSource(databaseId);
    return ds.query(sql, params ?? []);
  }

  /**
   * Obtiene un repository de TypeORM para una entidad dada y conexión.
   * @param databaseId identificador DB
   * @param entity clase de entidad o nombre
   */
  public getRepository<Entity extends ObjectLiteral>(
    databaseId: string,
    entity: any,
  ) {
    const ds = this.getDataSource(databaseId);
    return ds.getRepository<Entity>(entity);
  }

  /**
   * Cierra todas las conexiones al destruir el módulo.
   */
  public async onModuleDestroy() {
    for (const [id, ds] of this.dataSources.entries()) {
      try {
        if (ds && ds.isInitialized) {
          await ds.destroy();
          this.logger.log(`DataSource ${id} destroyed.`);
        }
      } catch (err) {
        this.logger.warn(
          `Error destroying DataSource ${id}: ${err?.message ?? err}`,
        );
      }
    }
  }
}
