import { Injectable, Logger } from '@nestjs/common';
import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseService } from './database/database.service';
@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    // @Column()
    // name: string;

    // @Column()
    // email: string;
}

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);

    constructor(private readonly db: DatabaseService) {}

    async findUserRaw(databaseId: string, userId: number) {
        // Uso raw SQL
        const conn = await this.db.connection(databaseId);
        return conn
            .createQueryBuilder()
            .select('*')
            .from('tbl_gestion', 'g')
            .where('g.id = :id', { id: userId })
            .getRawMany();
        // return await conn.query('SELECT * FROM tbl_gestion WHERE id = ?', [
        //     userId,
        // ]);
    }

    async findUserRepo(databaseId: string, userId: number) {
        const conn = await this.db.connection(databaseId);
        const repo = conn.getRepository(User);
        return repo.findOneBy({ id: userId });
    }

    async createUserInTransaction(databaseId: string, name: string) {
        await this.db.transaction(databaseId, async (trx) => {
            await trx.query(`INSERT INTO users (name) VALUES ('${name}')`);
            await trx.query(
                `INSERT INTO logs (message) VALUES ('User ${name} created')`,
            );
        });
    }
}
