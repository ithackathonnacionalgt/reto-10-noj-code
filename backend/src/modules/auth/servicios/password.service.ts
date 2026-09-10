import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Hashing de contrasenas con Argon2id (CLAUDE.md 19, 65). */
@Injectable()
export class PasswordService {
  private readonly opciones: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  };

  hash(textoPlano: string): Promise<string> {
    return argon2.hash(textoPlano, this.opciones);
  }

  async verificar(hash: string, textoPlano: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, textoPlano);
    } catch {
      return false;
    }
  }
}
