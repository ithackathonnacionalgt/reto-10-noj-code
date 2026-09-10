import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginacionDto } from '../../../common/dto/paginacion.dto.js';
import { EstadoPublicacion } from '../../../database/entities/enums.js';

export class CrearCategoriaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  urlIcono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class ActualizarCategoriaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  urlIcono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class FiltrosCategoriaDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;
}
