import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoLlaveApi } from '../../database/entities/enums.js';
import {
  LlaveApi,
  LlaveApiScope,
} from '../../database/entities/schema.js';
import {
  LIMITE_TASA_DEFECTO,
  PREFIJO_LLAVE,
  SCOPES_POR_DEFECTO,
  VENTANA_TASA_MS,
} from './api-keys.constants.js';
import type { CrearLlaveApiDto } from './dto/api-keys.dto.js';

/** Contexto de una API key validada, adjuntado a la peticion. */
export interface ContextoLlaveApi {
  id: string;
  nombre: string;
  scopes: string[];
  limiteTasa: number;
}

export type ResultadoValidacion =
  | { ok: true; contexto: ContextoLlaveApi }
  | { ok: false; motivo: 'invalida' | 'revocada' | 'expirada' };

interface EstadoTasa {
  contador: number;
  ventanaInicio: number;
}

@Injectable()
export class ApiKeysService {
  private readonly pepper: string;
  /** Limitador de tasa en memoria (fixed window). Suficiente para 1 instancia. */
  private readonly tasa = new Map<string, EstadoTasa>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(LlaveApi)
    private readonly repo: Repository<LlaveApi>,
    @InjectRepository(LlaveApiScope)
    private readonly repoScopes: Repository<LlaveApiScope>,
    config: ConfigService,
  ) {
    this.pepper = config.get<string>('API_KEY_PEPPER') ?? '';
  }

  private hash(llaveCompleta: string): string {
    return createHash('sha256')
      .update(this.pepper + llaveCompleta)
      .digest('hex');
  }

  // ---- Gestion por parte del dueno (JWT) --------------------------------

  /** Crea una API key. La llave completa se devuelve UNA sola vez (CLAUDE.md 17). */
  async crear(usuarioId: string, dto: CrearLlaveApiDto) {
    const secreto = randomBytes(24).toString('base64url');
    const llaveCompleta = `${PREFIJO_LLAVE}${secreto}`;
    const prefijo = `${PREFIJO_LLAVE}${secreto.slice(0, 8)}`;
    const scopes =
      dto.scopes && dto.scopes.length > 0 ? dto.scopes : [...SCOPES_POR_DEFECTO];
    const expiraEn = dto.expiraEnDias
      ? new Date(Date.now() + dto.expiraEnDias * 86_400_000)
      : null;

    const id = await this.dataSource.transaction(async (manager) => {
      const llave = await manager.getRepository(LlaveApi).save(
        manager.getRepository(LlaveApi).create({
          nombre: dto.nombre.trim(),
          nombreDesarrollador: dto.nombreDesarrollador?.trim() ?? null,
          propietarioUsuarioId: usuarioId,
          prefijoLlave: prefijo,
          hashLlave: this.hash(llaveCompleta),
          limiteTasa: LIMITE_TASA_DEFECTO,
          estado: EstadoLlaveApi.ACTIVA,
          expiraEn,
          creadaPor: usuarioId,
        }),
      );
      await manager.getRepository(LlaveApiScope).save(
        scopes.map((scope) => ({ llaveApiId: llave.id, scope })),
      );
      return llave.id;
    });

    const llave = await this.obtener(usuarioId, id);
    return { ...this.aResumen(llave), llaveCompleta };
  }

  async listar(usuarioId: string) {
    const llaves = await this.repo.find({
      where: { propietarioUsuarioId: usuarioId },
      relations: { scopes: true },
      order: { fechaCreacion: 'DESC' },
    });
    return llaves.map((l) => this.aResumen(l));
  }

  async obtener(usuarioId: string, id: string): Promise<LlaveApi> {
    const llave = await this.repo.findOne({
      where: { id, propietarioUsuarioId: usuarioId },
      relations: { scopes: true },
    });
    if (!llave) {
      throw new NotFoundException('API key no encontrada');
    }
    return llave;
  }

  async obtenerResumen(usuarioId: string, id: string) {
    return this.aResumen(await this.obtener(usuarioId, id));
  }

  /** Revoca la llave: deja de funcionar de inmediato, pero queda en el historial. */
  async revocar(usuarioId: string, id: string) {
    const llave = await this.obtener(usuarioId, id);
    llave.estado = EstadoLlaveApi.REVOCADA;
    await this.repo.save(llave);
    return this.aResumen(llave);
  }

  /** Elimina la llave por completo. */
  async eliminar(usuarioId: string, id: string): Promise<void> {
    const llave = await this.obtener(usuarioId, id);
    await this.repo.remove(llave);
  }

  /**
   * Regenera el secreto de una llave: el anterior deja de funcionar al instante,
   * el id y los scopes se conservan. Devuelve la nueva llave completa una vez.
   */
  async regenerar(usuarioId: string, id: string) {
    const llave = await this.obtener(usuarioId, id);
    const secreto = randomBytes(24).toString('base64url');
    const llaveCompleta = `${PREFIJO_LLAVE}${secreto}`;
    llave.prefijoLlave = `${PREFIJO_LLAVE}${secreto.slice(0, 8)}`;
    llave.hashLlave = this.hash(llaveCompleta);
    llave.estado = EstadoLlaveApi.ACTIVA;
    llave.ultimoUsoEn = null;
    await this.repo.save(llave);
    return { ...this.aResumen(llave), llaveCompleta };
  }

  // ---- Validacion en cada peticion ------------------------------------

  async validar(llaveCompleta: string): Promise<ResultadoValidacion> {
    if (!llaveCompleta.startsWith(PREFIJO_LLAVE)) {
      return { ok: false, motivo: 'invalida' };
    }
    const llave = await this.repo.findOne({
      where: { hashLlave: this.hash(llaveCompleta) },
      relations: { scopes: true },
    });
    if (!llave) {
      return { ok: false, motivo: 'invalida' };
    }
    if (llave.estado === EstadoLlaveApi.REVOCADA) {
      return { ok: false, motivo: 'revocada' };
    }
    if (llave.expiraEn && llave.expiraEn.getTime() < Date.now()) {
      if (llave.estado !== EstadoLlaveApi.EXPIRADA) {
        void this.repo
          .update({ id: llave.id }, { estado: EstadoLlaveApi.EXPIRADA })
          .catch(() => undefined);
      }
      return { ok: false, motivo: 'expirada' };
    }

    // Actualiza "ultimo uso" como maximo una vez por minuto.
    if (
      !llave.ultimoUsoEn ||
      Date.now() - llave.ultimoUsoEn.getTime() > 60_000
    ) {
      void this.repo
        .update({ id: llave.id }, { ultimoUsoEn: new Date() })
        .catch(() => undefined);
    }

    return {
      ok: true,
      contexto: {
        id: llave.id,
        nombre: llave.nombre,
        scopes: (llave.scopes ?? []).map((s) => s.scope),
        limiteTasa: llave.limiteTasa ?? LIMITE_TASA_DEFECTO,
      },
    };
  }

  /** Consume una unidad del limite de tasa de la llave (ventana de 60s). */
  consumirTasa(llaveId: string, limite: number) {
    const ahora = Date.now();
    let estado = this.tasa.get(llaveId);
    if (!estado || ahora - estado.ventanaInicio >= VENTANA_TASA_MS) {
      estado = { contador: 0, ventanaInicio: ahora };
      this.tasa.set(llaveId, estado);
    }
    estado.contador += 1;
    const resetEnEpoch = Math.ceil(
      (estado.ventanaInicio + VENTANA_TASA_MS) / 1000,
    );
    return {
      permitido: estado.contador <= limite,
      limite,
      restante: Math.max(0, limite - estado.contador),
      resetEnEpoch,
    };
  }

  // ---- Mapper -----------------------------------------------------------

  /** Vista segura de una llave: nunca incluye el hash ni la llave completa. */
  private aResumen(llave: LlaveApi) {
    return {
      id: llave.id,
      nombre: llave.nombre,
      nombreDesarrollador: llave.nombreDesarrollador,
      prefijo: llave.prefijoLlave,
      scopes: (llave.scopes ?? []).map((s) => s.scope).sort(),
      estado: llave.estado,
      limiteTasa: llave.limiteTasa ?? LIMITE_TASA_DEFECTO,
      ultimoUsoEn: llave.ultimoUsoEn,
      expiraEn: llave.expiraEn,
      creadaEn: llave.fechaCreacion,
    };
  }
}
