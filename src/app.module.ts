import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SomeService } from './some/other.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee .env automáticamente
    DatabaseModule.forRootFromEnv(), // lee process.env y crea las conexiones
  ],
  controllers: [AppController],
  providers: [AppService, SomeService],
})
export class AppModule {}
