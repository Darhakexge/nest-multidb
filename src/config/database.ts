import { registerAs } from '@nestjs/config';

const mysqlBase = {
    driver: 'mysql',
    host: process.env.DB_MYSQL_HOST ?? '127.0.0.1',
    username: process.env.DB_MYSQL_USER ?? 'root',
    password: process.env.DB_MYSQL_PASS ?? '',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    retryAttempts: 5,
    retryDelay: 3000,
};

export default registerAs('database', () => ({
    app1: {
        ...mysqlBase,
        host: process.env.DB_MYSQL_HOST ?? '127.0.0.1',
        port: +(process.env.DB_APP1_PORT ?? 3306),
        username: process.env.DB_MYSQL_USER ?? 'root',
        password: process.env.DB_MYSQL_PASS ?? '',
        database: process.env.DB_APP1_NAME ?? 'app_db',
    },
    analytics: {
        driver: 'postgres',
        host: process.env.DB_ANALYTICS_HOST ?? 'localhost',
        port: +(process.env.DB_ANALYTICS_PORT ?? 5432),
        database: process.env.DB_ANALYTICS_NAME ?? 'analytics_db',
        username: process.env.DB_ANALYTICS_USER ?? 'postgres',
        password: process.env.DB_ANALYTICS_PASSWORD ?? '',
        charset: process.env.DB_ANALYTICS_CHARSET ?? 'utf8',
        collation: process.env.DB_ANALYTICS_COLLATION ?? 'utf8_unicode_ci',
    },
}));
