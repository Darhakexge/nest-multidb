import { DynamicModule, Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { EnvDbConfig } from './database.types';

@Global()
@Module({})
export class DatabaseModule {
  /**
   * register() construye el módulo dinámicamente.
   * - envConfs: configuración pasada (usualmente parseada automáticamente).
   * Si prefieres que el módulo lea process.env internamente, usa DatabaseModule.forRootFromEnv()
   */
  static forRoot(confs: EnvDbConfig[]): DynamicModule {
    const providers = [
      DatabaseService,
      {
        provide: 'DATABASE_INIT_CONFIGS',
        useValue: confs,
      },
      {
        provide: 'DATABASE_MODULE_INIT',
        useFactory: async (
          dbService: DatabaseService,
          configs: EnvDbConfig[],
        ) => {
          await dbService.init(configs);
          return true;
        },
        inject: [DatabaseService, 'DATABASE_INIT_CONFIGS'],
      },
    ];

    return {
      module: DatabaseModule,
      providers,
      exports: [DatabaseService],
      global: true,
    };
  }

  /**
   * Alternativa: construye el módulo leyendo process.env directamente.
   * Esto es conveniente si no quieres parsear el env tu mismo.
   */
  static forRootFromEnv(): DynamicModule {
    const configs = DatabaseModule.parseEnv();
    return DatabaseModule.forRoot(configs);
  }

  /**
   * Parsear process.env buscando variables DB_<ID>_*
   */
  private static parseEnv(): EnvDbConfig[] {
    const env = process.env;
    const map = new Map<string, Partial<EnvDbConfig>>();

    const re =
      /^DB_([^_]+)_(TYPE|HOST|PORT|USER|PASS|NAME|RETRY_ATTEMPTS|RETRY_DELAY_MS)$/;

    for (const key of Object.keys(env)) {
      const m = key.match(re);
      if (!m) continue;
      const id = m[1];
      const prop = m[2];

      const raw = env[key]!;
      const current = map.get(id) ?? ({ id } as Partial<EnvDbConfig>);

      switch (prop) {
        case 'TYPE':
          current.type = raw.toLowerCase() as any;
          break;
        case 'HOST':
          current.host = raw;
          break;
        case 'PORT':
          current.port = Number(raw);
          break;
        case 'USER':
          current.username = raw;
          break;
        case 'PASS':
          current.password = raw;
          break;
        case 'NAME':
          current.database = raw;
          break;
        case 'RETRY_ATTEMPTS':
          current.retryAttempts = Number(raw);
          break;
        case 'RETRY_DELAY_MS':
          current.retryDelayMs = Number(raw);
          break;
      }
      map.set(id, current);
    }

    // Validate and transform
    const results: EnvDbConfig[] = [];
    for (const [id, partial] of map.entries()) {
      const missing: string[] = [];
      if (!partial.type) missing.push('TYPE');
      if (!partial.host) missing.push('HOST');
      if (!partial.port) missing.push('PORT');
      if (!partial.username) missing.push('USER');
      if (partial.password === undefined) missing.push('PASS');
      if (!partial.database) missing.push('NAME');

      if (missing.length > 0) {
        throw new Error(
          `DB_${id}_* variables incomplete. Missing: ${missing.join(', ')}`,
        );
      }

      // ensure type supported
      const t = partial.type as any;
      if (t !== 'mysql' && t !== 'postgres') {
        throw new Error(
          `DB_${id}_TYPE must be 'mysql' or 'postgres'. Found: ${partial.type}`,
        );
      }

      results.push({
        id,
        type: t,
        host: partial.host!,
        port: partial.port!,
        username: partial.username!,
        password: partial.password!,
        database: partial.database!,
        retryAttempts: partial.retryAttempts,
        retryDelayMs: partial.retryDelayMs,
      });
    }

    return results;
  }
}
