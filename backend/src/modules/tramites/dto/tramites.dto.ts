import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginacionDto } from '../../../common/dto/paginacion.dto.js';
import { ABoolean } from '../../../common/utils/transform.js';
import {
  CalidadDatos,
  Canal,
  EstadoPublicacion,
  Modalidad,
  ModoEjecucion,
  ParteResponsable,
  TipoCosto,
  TipoRequisito,
  TipoVideoSenas,
  UnidadTiempo,
} from '../../../database/entities/enums.js';

export class CrearTramiteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  nombre: string;

  @IsUUID()
  institucionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcionCorta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string;

  @IsOptional()
  @IsEnum(ModoEjecucion)
  modoEjecucion?: ModoEjecucion;

  @IsOptional()
  @IsEnum(Modalidad)
  modalidad?: Modalidad;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  dirigidoA?: string;

  @IsOptional()
  @ABoolean()
  disponibleEnLinea?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlExterna?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlFuenteOficial?: string;

  @IsOptional()
  @IsEnum(TipoCosto)
  tipoCosto?: TipoCosto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  moneda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tiempoRespuestaValor?: number;

  @IsOptional()
  @IsEnum(UnidadTiempo)
  tiempoRespuestaUnidad?: UnidadTiempo;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tiempoRespuestaTexto?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  periodoValidez?: string;

  @IsOptional()
  @IsUUID()
  departamentoId?: string;

  @IsOptional()
  @IsUUID()
  municipioId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @IsEnum(CalidadDatos)
  calidadDatos?: CalidadDatos;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  categoriaIds?: string[];
}

export class ActualizarTramiteDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  nombre?: string;

  @IsOptional()
  @IsUUID()
  institucionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcionCorta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string;

  @IsOptional()
  @IsEnum(ModoEjecucion)
  modoEjecucion?: ModoEjecucion;

  @IsOptional()
  @IsEnum(Modalidad)
  modalidad?: Modalidad;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  dirigidoA?: string;

  @IsOptional()
  @ABoolean()
  disponibleEnLinea?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlExterna?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlFuenteOficial?: string;

  @IsOptional()
  @IsEnum(TipoCosto)
  tipoCosto?: TipoCosto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  moneda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tiempoRespuestaValor?: number;

  @IsOptional()
  @IsEnum(UnidadTiempo)
  tiempoRespuestaUnidad?: UnidadTiempo;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tiempoRespuestaTexto?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  periodoValidez?: string;

  @IsOptional()
  @IsUUID()
  departamentoId?: string;

  @IsOptional()
  @IsUUID()
  municipioId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @IsEnum(CalidadDatos)
  calidadDatos?: CalidadDatos;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  categoriaIds?: string[];
}

export class FiltrosTramiteDto extends PaginacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsUUID()
  institucionId?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsEnum(Modalidad)
  modalidad?: Modalidad;

  @IsOptional()
  @IsEnum(ModoEjecucion)
  modoEjecucion?: ModoEjecucion;

  @IsOptional()
  @IsEnum(TipoCosto)
  tipoCosto?: TipoCosto;

  @IsOptional()
  @ABoolean()
  disponibleEnLinea?: boolean;

  @IsOptional()
  @IsUUID()
  departamentoId?: string;

  @IsOptional()
  @IsUUID()
  municipioId?: string;

  /** Solo se aplica en el area administrativa. */
  @IsOptional()
  @IsEnum(EstadoPublicacion)
  estado?: EstadoPublicacion;

  @IsOptional()
  @IsIn(['recientes', 'nombre', 'populares'])
  orden?: 'recientes' | 'nombre' | 'populares';
}

export class CrearRequisitoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(TipoRequisito)
  tipo?: TipoRequisito;

  @IsOptional()
  @ABoolean()
  esObligatorio?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad?: number;

  @IsOptional()
  @ABoolean()
  requiereArchivo?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tiposArchivoPermitidos?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  diasValidez?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;
}

export class CrearPasoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsEnum(ParteResponsable)
  parteResponsable?: ParteResponsable;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tiempoEstimado?: string;

  @IsOptional()
  @IsEnum(Canal)
  canal?: Canal;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  ubicacion?: string;

  @IsOptional()
  @ABoolean()
  requierePago?: boolean;

  @IsOptional()
  @ABoolean()
  requiereDocumento?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlExterna?: string;
}

export class CrearVideoSenasDto {
  /** Video de la descripcion corta del tramite, o del paso a paso (CLAUDE.md 11). */
  @IsEnum(TipoVideoSenas)
  tipo: TipoVideoSenas;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlVideo: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  urlMiniatura?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duracionSegundos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  transcripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lenguaSenas?: string;
}

export class ActualizarEtiquetasDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  etiquetas: string[];
}
