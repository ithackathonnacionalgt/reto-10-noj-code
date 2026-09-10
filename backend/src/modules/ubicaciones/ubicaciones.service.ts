import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Departamento,
  Municipio,
} from '../../database/entities/schema.js';

/** Catalogo geografico para filtros del frontend (CLAUDE.md 29). */
@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(Departamento)
    private readonly departamentos: Repository<Departamento>,
    @InjectRepository(Municipio)
    private readonly municipios: Repository<Municipio>,
  ) {}

  listarDepartamentos(): Promise<Departamento[]> {
    return this.departamentos.find({ order: { nombre: 'ASC' } });
  }

  listarMunicipios(departamentoId?: string): Promise<Municipio[]> {
    return this.municipios.find({
      where: departamentoId ? { departamentoId } : {},
      order: { nombre: 'ASC' },
    });
  }
}
