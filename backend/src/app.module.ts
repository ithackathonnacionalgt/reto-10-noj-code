import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { configuration } from './config/configuration.js';
import { DatabaseModule } from './database/database.module.js';
import { ApiKeysModule } from './modules/api-keys/api-keys.module.js';
import { ApiKeyContextMiddleware } from './modules/api-keys/api-keys.middleware.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriasModule } from './modules/categorias/categorias.module.js';
import { InstitucionesModule } from './modules/instituciones/instituciones.module.js';
import { TramitesModule } from './modules/tramites/tramites.module.js';
import { UbicacionesModule } from './modules/ubicaciones/ubicaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    AuthModule,
    ApiKeysModule,
    InstitucionesModule,
    CategoriasModule,
    TramitesModule,
    UbicacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // RequestId primero (lo usa el manejo de errores), luego el contexto de API key.
    consumer
      .apply(RequestIdMiddleware, ApiKeyContextMiddleware)
      .forRoutes('*');
  }
}
