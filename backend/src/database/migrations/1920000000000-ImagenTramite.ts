import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ImagenTramite1920000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "tramites" ADD COLUMN "url_imagen" text');
    await queryRunner.query(
      'UPDATE "tramites" SET "url_imagen" = $1, "fecha_actualizacion" = now() WHERE "slug" = $2',
      [
        'https://kurfupsatffvorhgvnaf.supabase.co/storage/v1/object/public/Fotos%20tramites/ChatGPT%20Image%2011%20sept%202026,%2001_56_04.png',
        'renovacion-de-dpi-por-vencimiento',
      ],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "tramites" DROP COLUMN "url_imagen"');
  }
}
