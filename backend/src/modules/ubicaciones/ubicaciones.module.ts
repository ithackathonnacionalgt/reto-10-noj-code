import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Departamento,
  Municipio,
} from '../../database/entities/schema.js';
import { UbicacionesController } from './ubicaciones.controller.js';
import { UbicacionesService } from './ubicaciones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Departamento, Municipio])],
  controllers: [UbicacionesController],
  providers: [UbicacionesService],
  exports: [UbicacionesService],
})
export class UbicacionesModule {}
