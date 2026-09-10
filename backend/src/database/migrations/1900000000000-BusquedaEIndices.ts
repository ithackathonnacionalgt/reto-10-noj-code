import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indices para busqueda de tramites (CLAUDE.md 28).
 *
 * DEBE ejecutarse DESPUES de la migracion que crea las tablas (EsquemaInicial).
 * Por eso el timestamp del nombre es deliberadamente alto (1900000000000):
 * asi TypeORM siempre la ejecuta al final.
 *
 * Agrega:
 *  - extension pg_trgm (en el schema `extensions` de Supabase)
 *  - indices GIN de trigramas para busqueda difusa / tolerancia a errores
 *  - columna generada busqueda_tsv (tsvector espanol, con pesos) + indice GIN
 *  - indices parciales para el listado publico
 *
 * Nota: no se usa unaccent; el proyecto maneja texto sin tildes.
 */
export class BusquedaEIndices1900000000000 implements MigrationInterface {
  name = 'BusquedaEIndices1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions`,
    );

    // --- Trigramas (busqueda difusa, case-insensitive) ---
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_nombre_trgm
        ON tramites USING gin (lower(nombre) gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_desc_corta_trgm
        ON tramites USING gin (lower(coalesce(descripcion_corta, '')) gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_descripcion_trgm
        ON tramites USING gin (lower(coalesce(descripcion, '')) gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_codigo_trgm
        ON tramites USING gin (lower(coalesce(codigo, '')) gin_trgm_ops)
    `);

    // --- Full text search (espanol, con pesos por campo) ---
    await queryRunner.query(`
      ALTER TABLE tramites
        ADD COLUMN IF NOT EXISTS busqueda_tsv tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('spanish', coalesce(nombre, '')), 'A') ||
          setweight(to_tsvector('spanish', coalesce(codigo, '')), 'A') ||
          setweight(to_tsvector('spanish', coalesce(descripcion_corta, '')), 'B') ||
          setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'C') ||
          setweight(to_tsvector('spanish', coalesce(dirigido_a, '')), 'D')
        ) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_busqueda_tsv
        ON tramites USING gin (busqueda_tsv)
    `);

    // --- Instituciones y categorias ---
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_instituciones_nombre_trgm
        ON instituciones USING gin (lower(nombre) gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_instituciones_siglas_trgm
        ON instituciones USING gin (lower(coalesce(siglas, '')) gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_categorias_nombre_trgm
        ON categorias USING gin (lower(nombre) gin_trgm_ops)
    `);

    // --- Indices parciales para el listado publico ---
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_pub_fecha
        ON tramites (publicado_en DESC NULLS LAST)
        WHERE estado = 'publicado'::"public"."tramites_estado_enum"
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_pub_vistas
        ON tramites (vistas DESC)
        WHERE estado = 'publicado'::"public"."tramites_estado_enum"
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tramites_inst_estado
        ON tramites (institucion_id, estado)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_inst_estado`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_pub_vistas`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_pub_fecha`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_categorias_nombre_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_instituciones_siglas_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_instituciones_nombre_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_busqueda_tsv`);
    await queryRunner.query(
      `ALTER TABLE tramites DROP COLUMN IF EXISTS busqueda_tsv`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_codigo_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_descripcion_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_desc_corta_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tramites_nombre_trgm`);
  }
}
