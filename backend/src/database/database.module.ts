import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesTypeorm } from '../config/typeorm-options.js';

/**
 * Modulo de acceso a datos. Configura la conexion a PostgreSQL (Supabase)
 * desde variables de entorno. `synchronize` siempre es false: los cambios de
 * esquema van por migraciones (CLAUDE.md 58).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...opcionesTypeorm(),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
