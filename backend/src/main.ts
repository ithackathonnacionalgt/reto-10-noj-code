import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformarRespuestaInterceptor } from './common/interceptors/transformar-respuesta.interceptor.js';

/** Falla el arranque si falta configuracion critica en produccion. */
function verificarConfigProduccion(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const faltantes = ['JWT_SECRET', 'API_KEY_PEPPER', 'DB_HOST', 'DB_PASSWORD'].filter(
    (clave) => !process.env[clave],
  );
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias en produccion: ${faltantes.join(', ')}`,
    );
  }
}

async function bootstrap() {
  verificarConfigProduccion();

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      // Elimina propiedades no declaradas en el DTO en vez de rechazar la
      // peticion: una API publica no debe romperse por un ?utm_source=... extra.
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformarRespuestaInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const origenes = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origenes.length === 0) {
    new Logger('Bootstrap').warn(
      'CORS_ORIGINS vacio: se bloquean las llamadas cross-origin del navegador (el SSR del frontend igual funciona).',
    );
  }
  app.enableCors({
    origin: origenes.length > 0 ? origenes : false,
    credentials: true,
  });

  // Render (y otros PaaS) inyectan PORT en el entorno; hay que escuchar en 0.0.0.0.
  const puerto = Number(process.env.PORT ?? config.get<string>('PORT') ?? 3000);
  await app.listen(puerto, '0.0.0.0');
  new Logger('Bootstrap').log(`API escuchando en :${puerto} (prefijo /api/v1)`);
}

await bootstrap();
