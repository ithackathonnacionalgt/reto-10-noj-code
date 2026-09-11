import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Categoria,
  Institucion,
  Tramite,
  TramiteCategoria,
  TramiteHistorialEstado,
  TramitePaso,
  TramiteRequisito,
  TramiteVersion,
  VideoSenas,
} from '../../database/entities/schema.js';
import { TramitesAdminController } from './tramites.admin.controller.js';
import { TramitesController } from './tramites.controller.js';
import { TramitesService } from './tramites.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tramite,
      TramiteCategoria,
      TramiteRequisito,
      TramitePaso,
      TramiteHistorialEstado,
      TramiteVersion,
      Institucion,
      Categoria,
      VideoSenas,
    ]),
  ],
  controllers: [TramitesController, TramitesAdminController],
  providers: [TramitesService],
  exports: [TramitesService],
})
export class TramitesModule {}
