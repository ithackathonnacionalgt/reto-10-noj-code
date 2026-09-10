import { IsString, MinLength } from 'class-validator';

export class RefrescarTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken: string;
}
