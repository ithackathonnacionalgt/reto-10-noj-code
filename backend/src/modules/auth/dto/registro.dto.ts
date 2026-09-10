import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Datos para registrar una cuenta ciudadana (CLAUDE.md 36). */
export class RegistroDto {
  @IsEmail({}, { message: 'El correo no es valido' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombres: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  apellidos: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/, { message: 'El DPI debe tener 13 digitos' })
  dpi?: string;
}
