import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega:
 *  - `tramites.etiquetas` (text[]): sinonimos/palabras clave curadas para la
 *    busqueda (CLAUDE.md 28), indexadas para full-text y trigram, de forma
 *    que la busqueda tolere variantes por palabra ("policiacos" ~
 *    "policiales") sin importar el orden en que se escriban los terminos.
 *  - `tramites_videos_senas.tipo` (descripcion | pasos): permite guardar un
 *    video LENSEGUA de la descripcion corta y otro de los pasos por tramite
 *    (CLAUDE.md 11).
 *
 * Nota tecnica: en esta version de Postgres `array_to_string()` esta marcada
 * STABLE (no IMMUTABLE, por sensibilidad a collation), y tanto las columnas
 * generadas como los indices de expresion exigen IMMUTABLE. Se crea un
 * wrapper `f_array_to_string` IMMUTABLE (mismo patron que `f_unaccent` en la
 * migracion anterior): es seguro porque las etiquetas son texto simple, sin
 * comparaciones de collation.
 *
 * Debe correr despues de BusquedaEIndices (timestamp mayor).
 */
export class EtiquetasYVideos1910000000000 implements MigrationInterface {
  name = 'EtiquetasYVideos1910000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Columna de etiquetas ------------------------------------
    await queryRunner.query(`
      ALTER TABLE tramites
        ADD COLUMN IF NOT EXISTS etiquetas text[] NOT NULL DEFAULT '{}'
    `);

    // --- 2. Wrapper IMMUTABLE de array_to_string ---------------------
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION f_array_to_string(text[], text)
      RETURNS text
      LANGUAGE sql IMMUTABLE PARALLEL SAFE
      AS $func$ SELECT array_to_string($1, $2) $func$
    `);

    // --- 3. Indices de busqueda sobre etiquetas -----------------------
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_etiquetas_tsv
        ON tramites USING gin (to_tsvector('spanish', f_array_to_string(etiquetas, ' ')))
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_etiquetas_trgm
        ON tramites USING gin (lower(f_array_to_string(etiquetas, ' ')) gin_trgm_ops)
    `);
    // Contencion exacta (etiquetas @> ARRAY['x']), util para filtros futuros.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_etiquetas_arr
        ON tramites USING gin (etiquetas)
    `);

    // --- 4. Tipo de video LENSEGUA ------------------------------------
    await queryRunner.query(`
      CREATE TYPE "public"."tramites_videos_senas_tipo_enum" AS ENUM ('descripcion', 'pasos')
    `);
    await queryRunner.query(`
      ALTER TABLE tramites_videos_senas
        ADD COLUMN IF NOT EXISTS tipo "public"."tramites_videos_senas_tipo_enum"
        NOT NULL DEFAULT 'descripcion'
    `);
    await queryRunner.query(`
      ALTER TABLE tramites_videos_senas
        ADD CONSTRAINT "UQ_tramites_videos_senas_tramite_tipo_lengua"
        UNIQUE (tramite_id, tipo, lengua_senas)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tramites_videos_senas
        DROP CONSTRAINT IF EXISTS "UQ_tramites_videos_senas_tramite_tipo_lengua"
    `);
    await queryRunner.query(
      `ALTER TABLE tramites_videos_senas DROP COLUMN IF EXISTS tipo`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."tramites_videos_senas_tipo_enum"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_etiquetas_arr`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_etiquetas_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_etiquetas_tsv`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS f_array_to_string(text[], text)`);

    await queryRunner.query(
      `ALTER TABLE tramites DROP COLUMN IF EXISTS etiquetas`,
    );
  }
}
