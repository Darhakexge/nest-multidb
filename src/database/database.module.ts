import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({})
export class DatabaseModule {
    static forRootFromConfig(): DynamicModule {
        return {
            module: DatabaseModule,
            providers: [
                DatabaseService,
                {
                    provide: 'DATABASE_CONFIG',
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        return configService.get('database') || {};
                    },
                },
            ],
            exports: [DatabaseService],
        };
    }
}
