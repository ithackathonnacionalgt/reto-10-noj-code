import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EXPIRACION_MAX_DIAS,
  SCOPES_DISPONIBLES,
} from '../api-keys.constants.js';

export class CrearLlaveApiDto {
  /** Nombre para identificar la llave (ej. "App movil de la Muni X"). */
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreDesarrollador?: string;

  /** Scopes solicitados. Si se omite, se asignan los de solo lectura. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(SCOPES_DISPONIBLES as unknown as string[], { each: true })
  scopes?: string[];

  /** Dias hasta la expiracion. Si se omite, la llave no expira. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EXPIRACION_MAX_DIAS)
  expiraEnDias?: number;
}
