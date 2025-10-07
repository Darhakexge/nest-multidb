import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            validateCustomDecorators: true,
        }),
    );

    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
