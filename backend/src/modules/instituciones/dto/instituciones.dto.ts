import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginacionDto } from '../../../common/dto/paginacion.dto.js';
import { EstadoPublicacion } from '../../../database/entities/enums.js';

export class CrearInstitucionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  siglas?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  urlLogo?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  /** Slug opcional; si no se envia se genera a partir del nombre. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class ActualizarInstitucionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  siglas?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  urlLogo?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  sitioWeb?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class FiltrosInstitucionDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  /** Solo para el area administrativa. */
  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;
}
