/**
 * Seed idempotente de datos base (CLAUDE.md 59).
 * Ejecutar con: npm run seed  (requiere backend/.env con DATABASE_URL/DIRECT_URL)
 *
 * Crea: permisos, roles + role_permissions, idiomas, departamentos + municipios
 * (solo cabeceras), instituciones y categorias publicadas, un usuario
 * super administrador y tramites de ejemplo. Volver a ejecutarlo no duplica nada.
 */
import 'reflect-metadata';
import * as argon2 from 'argon2';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type FindOptionsWhere,
  type ObjectLiteral,
} from 'typeorm';
import { AppDataSource } from '../data-source.js';
import {
  generarSlug,
} from '../../common/utils/slug.js';
import {
  CalidadDatos,
  EstadoPublicacion,
  EstadoUsuario,
  ModoEjecucion,
  TipoFuente,
  TipoRequisito,
} from '../entities/enums.js';
import {
  Categoria,
  Departamento,
  Institucion,
  Municipio,
  Permiso,
  Rol,
  RolPermiso,
  Tramite,
  TramiteCategoria,
  TramitePaso,
  TramiteRequisito,
  Usuario,
  UsuarioRol,
} from '../entities/schema.js';
import {
  CATEGORIAS_SEED,
  DEPARTAMENTOS_SEED,
  IDIOMAS_SEED,
  INSTITUCIONES_SEED,
  PERMISOS_SEED,
  ROLES_SEED,
  TRAMITES_SEED,
} from './datos-base.js';
import { Idioma } from '../entities/schema.js';
import { randomBytes } from 'node:crypto';

async function obtenerOCrear<T extends ObjectLiteral>(
  manager: EntityManager,
  entidad: new () => T,
  clave: Partial<T>,
  valores: Partial<T>,
): Promise<T> {
  const repo = manager.getRepository(entidad);
  const existente = await repo.findOne({
    where: clave as FindOptionsWhere<T>,
  });
  if (existente) {
    return existente;
  }
  const creado = repo.create({ ...clave, ...valores } as DeepPartial<T>);
  return repo.save(creado);
}

async function sembrarPermisosYRoles(manager: EntityManager): Promise<void> {
  for (const permiso of PERMISOS_SEED) {
    await obtenerOCrear(
      manager,
      Permiso,
      { clave: permiso.clave },
      { descripcion: permiso.descripcion, grupo: permiso.grupo },
    );
  }

  const permisos = await manager.getRepository(Permiso).find();
  const permisoPorClave = new Map(permisos.map((p) => [p.clave, p]));

  for (const rol of ROLES_SEED) {
    const rolEntidad = await obtenerOCrear(
      manager,
      Rol,
      { clave: rol.clave },
      { nombre: rol.nombre, descripcion: rol.descripcion, esSistema: true },
    );

    for (const clavePermiso of rol.permisos) {
      const permiso = permisoPorClave.get(clavePermiso);
      if (!permiso) continue;
      await obtenerOCrear(
        manager,
        RolPermiso,
        { rolId: rolEntidad.id, permisoId: permiso.id },
        {},
      );
    }
  }
  console.log(
    `  permisos: ${PERMISOS_SEED.length} | roles: ${ROLES_SEED.length}`,
  );
}

async function sembrarIdiomas(manager: EntityManager): Promise<void> {
  for (const idioma of IDIOMAS_SEED) {
    await obtenerOCrear(
      manager,
      Idioma,
      { codigo: idioma.codigo },
      {
        nombre: idioma.nombre,
        nombreNativo: idioma.nombreNativo,
        esMaya: idioma.esMaya,
        activo: true,
        orden: idioma.orden,
      },
    );
  }
  console.log(`  idiomas: ${IDIOMAS_SEED.length}`);
}

async function sembrarGeografia(manager: EntityManager): Promise<void> {
  for (const dep of DEPARTAMENTOS_SEED) {
    const departamento = await obtenerOCrear(
      manager,
      Departamento,
      { codigo: dep.codigo },
      { nombre: dep.nombre },
    );
    await obtenerOCrear(
      manager,
      Municipio,
      { departamentoId: departamento.id, nombre: dep.cabecera },
      { codigo: `${dep.codigo}01` },
    );
  }
  console.log(
    `  departamentos: ${DEPARTAMENTOS_SEED.length} (con su cabecera municipal)`,
  );
}

async function sembrarCatalogo(manager: EntityManager): Promise<void> {
  for (const inst of INSTITUCIONES_SEED) {
    await obtenerOCrear(
      manager,
      Institucion,
      { slug: inst.slug },
      {
        nombre: inst.nombre,
        siglas: inst.siglas,
        sitioWeb: inst.sitioWeb,
        estado: EstadoPublicacion.PUBLICADO,
        publicadoEn: new Date(),
      },
    );
  }

  for (const cat of CATEGORIAS_SEED) {
    await obtenerOCrear(
      manager,
      Categoria,
      { slug: cat.slug },
      {
        nombre: cat.nombre,
        orden: cat.orden,
        estado: EstadoPublicacion.PUBLICADO,
      },
    );
  }
  console.log(
    `  instituciones: ${INSTITUCIONES_SEED.length} | categorias: ${CATEGORIAS_SEED.length}`,
  );
}

async function sembrarSuperAdmin(manager: EntityManager): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@tramites.gob.gt')
    .toLowerCase()
    .trim();
  const passwordPlano =
    process.env.SEED_ADMIN_PASSWORD ?? 'CambiaEstaClave123!';

  const yaExiste = await manager
    .getRepository(Usuario)
    .findOne({ where: { email } });
  if (yaExiste) {
    console.log(`  super admin: ya existe (${email})`);
    return;
  }

  const hash = await argon2.hash(passwordPlano, { type: argon2.argon2id });
  const usuario = await manager.getRepository(Usuario).save(
    manager.getRepository(Usuario).create({
      email,
      hashPassword: hash,
      nombres: 'Super',
      apellidos: 'Administrador',
      estado: EstadoUsuario.ACTIVO,
      emailVerificadoEn: new Date(),
    }),
  );

  const rol = await manager
    .getRepository(Rol)
    .findOneOrFail({ where: { clave: 'super_admin' } });
  await manager.getRepository(UsuarioRol).save(
    manager.getRepository(UsuarioRol).create({
      usuarioId: usuario.id,
      rolId: rol.id,
      institucionId: null,
    }),
  );
  console.log(`  super admin: creado (${email} / ${passwordPlano})`);
}

async function sembrarTramitesEjemplo(manager: EntityManager): Promise<void> {
  const instituciones = await manager.getRepository(Institucion).find();
  const categorias = await manager.getRepository(Categoria).find();
  const instPorSlug = new Map(instituciones.map((i) => [i.slug, i]));
  const catPorSlug = new Map(categorias.map((c) => [c.slug, c]));

  for (const semilla of TRAMITES_SEED) {
    const institucion = instPorSlug.get(semilla.institucionSlug);
    if (!institucion) continue;

    let tramite = await manager
      .getRepository(Tramite)
      .findOne({ where: { slug: semilla.slug } });

    if (!tramite) {
      tramite = await manager.getRepository(Tramite).save(
        manager.getRepository(Tramite).create({
          publicId: `TR-${randomBytes(5).toString('hex').toUpperCase()}`,
          slug: generarSlug(semilla.slug),
          nombre: semilla.nombre,
          descripcionCorta: semilla.descripcionCorta,
          descripcion: semilla.descripcion,
          institucionId: institucion.id,
          modoEjecucion: ModoEjecucion.SOLO_INFORMACION,
          tipoFuente: TipoFuente.PENDIENTE_VERIFICAR,
          calidadDatos: CalidadDatos.PARCIAL,
          estado: semilla.publicar
            ? EstadoPublicacion.PUBLICADO
            : EstadoPublicacion.BORRADOR,
          publicadoEn: semilla.publicar ? new Date() : null,
        }),
      );

      const idsCategoria = semilla.categoriaSlugs
        .map((s) => catPorSlug.get(s)?.id)
        .filter((v): v is string => Boolean(v));
      await manager.getRepository(TramiteCategoria).save(
        idsCategoria.map((categoriaId, indice) => ({
          tramiteId: tramite!.id,
          categoriaId,
          esPrincipal: indice === 0,
        })),
      );

      await manager.getRepository(TramiteRequisito).save(
        semilla.requisitos.map((r, indice) => ({
          tramiteId: tramite!.id,
          titulo: r.titulo,
          descripcion: r.descripcion,
          tipo: TipoRequisito.DOCUMENTO,
          esObligatorio: true,
          orden: indice,
        })),
      );

      await manager.getRepository(TramitePaso).save(
        semilla.pasos.map((p, indice) => ({
          tramiteId: tramite!.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          orden: indice,
        })),
      );
    }
  }
  console.log(`  tramites de ejemplo: ${TRAMITES_SEED.length}`);
}

async function main(): Promise<void> {
  const ds: DataSource = await AppDataSource.initialize();
  console.log('Sembrando datos base...');
  try {
    await ds.transaction(async (manager) => {
      await sembrarPermisosYRoles(manager);
      await sembrarIdiomas(manager);
      await sembrarGeografia(manager);
      await sembrarCatalogo(manager);
      await sembrarSuperAdmin(manager);
      await sembrarTramitesEjemplo(manager);
    });
    console.log('Seed completado.');
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('Fallo el seed:', error);
  process.exitCode = 1;
});
