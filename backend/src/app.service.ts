import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      estado: 'ok',
      servicio: 'plataforma-nacional-tramites-api',
      hora: new Date().toISOString(),
    };
  }
}
