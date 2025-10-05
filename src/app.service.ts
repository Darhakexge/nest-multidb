import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
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

  /**
   * Ejecuta una consulta preparada en la DB identificada.
   */
  async findUserByIdRaw(databaseId: string, userId: number) {
    const sql = 'SELECT * FROM tbl_gestion WHERE id = $1';
    const params = [userId];
    // Para postgres el placeholder sería $1 pero TypeORM query() acepta parámetros en forma de array y los adapta.
    const result = await this.db.query(databaseId, sql, params);
    return result;
  }

  /**
   * Usa repositorio y entidad para obtener datos (con TypeORM features).
   */
  async findUserByIdRepo(databaseId: string, userId: number) {
    const repo = this.db.getRepository<User>(databaseId, User);
    const user = await repo.findOneBy({ id: userId });
    return user;
  }

  /**
   * Inserta usuario vía raw SQL preparado.
   */
  async createUserRaw(databaseId: string, name: string, email: string) {
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    const res = await this.db.query(databaseId, sql, [name, email]);
    // Dependiendo del driver, res puede ser resultado distinto (insertId, rowCount, etc.)
    return res;
  }
}
