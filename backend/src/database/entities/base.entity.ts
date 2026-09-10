import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type ValueTransformer,
} from 'typeorm';

/**
 * Entidad base: identificador UUID generado por PostgreSQL.
 * Todas las tablas usan UUID como PK (CLAUDE.md 21).
 */
export abstract class EntidadBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}

/**
 * Entidad base con marcas de tiempo de creacion y actualizacion.
 */
export abstract class EntidadAuditable extends EntidadBase {
  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;
}

/** Convierte numeric de PostgreSQL (string) a number de JS y viceversa. */
export const transformadorNumerico: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | null) =>
    valor === null || valor === undefined ? valor : Number(valor),
};

/** Convierte bigint de PostgreSQL (string) a number de JS y viceversa. */
export const transformadorEntero: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | null) =>
    valor === null || valor === undefined ? valor : Number.parseInt(valor, 10),
};
