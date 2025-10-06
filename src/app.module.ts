import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database';
import { DatabaseModule } from './database/database.module';

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
    providers: [AppService],
})
export class AppModule {}
