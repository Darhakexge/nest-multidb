import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchemaValidationService } from './common/services/schema-validation.service';
import databaseConfig from './config/database';
import { DatabaseModule } from './database/database.module';
import { SchemaValidatorConstraint } from './validators/schema-validator.constraint';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [databaseConfig],
        }),
        DatabaseModule.forRootFromConfig(), // carga automáticamente config/database.ts
    ],
    controllers: [AppController],
    providers: [AppService, SchemaValidationService, SchemaValidatorConstraint],
    exports: [SchemaValidationService, SchemaValidatorConstraint],
})
export class AppModule {}
