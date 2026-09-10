/**
 * DataSource de TypeORM para la CLI de migraciones.
 *
 * Uso (requiere backend/.env con credenciales de la BD):
 *   npm run migration:generate -- ./src/database/migrations/EsquemaInicial
 *   npm run migration:run
 *   npm run migration:revert
 *
 * Lee credenciales sueltas (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) o,
 * si se prefiere, DIRECT_URL / DATABASE_URL. Ver src/config/typeorm-options.ts.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { opcionesTypeorm } from '../config/typeorm-options.js';

export const AppDataSource = new DataSource(
  opcionesTypeorm({ directo: true, migraciones: true }),
);
