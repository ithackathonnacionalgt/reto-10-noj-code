import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Institucion,
  InstitucionContacto,
  InstitucionDireccion,
} from '../../database/entities/schema.js';
import { InstitucionesAdminController } from './instituciones.admin.controller.js';
import { InstitucionesController } from './instituciones.controller.js';
import { InstitucionesService } from './instituciones.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institucion,
      InstitucionContacto,
      InstitucionDireccion,
    ]),
  ],
  controllers: [InstitucionesController, InstitucionesAdminController],
  providers: [InstitucionesService],
  exports: [InstitucionesService],
})
export class InstitucionesModule {}
