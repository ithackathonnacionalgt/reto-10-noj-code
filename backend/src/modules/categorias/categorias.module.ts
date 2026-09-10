import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../../database/entities/schema.js';
import { CategoriasAdminController } from './categorias.admin.controller.js';
import { CategoriasController } from './categorias.controller.js';
import { CategoriasService } from './categorias.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria])],
  controllers: [CategoriasController, CategoriasAdminController],
  providers: [CategoriasService],
  exports: [CategoriasService],
})
export class CategoriasModule {}
