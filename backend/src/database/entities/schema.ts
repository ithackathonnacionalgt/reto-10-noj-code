/**
 * Modelo de datos completo de la Plataforma Nacional de Tramites (CLAUDE.md 9).
 *
 * Todas las entidades viven en un solo archivo. Las propiedades de relacion se
 * tipan con `Relation<T>` para evitar el error "Cannot access X before
 * initialization" que produce `emitDecoratorMetadata` con relaciones circulares.
 *
 * Nombres de tablas y columnas en espanol sin tildes. El DB Diagram original
 * (bd.sql) se usa como fuente de diseno, priorizando CLAUDE.md (CLAUDE.md 22).
 */
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  type Relation,
  Unique,
} from 'typeorm';
import {
  EntidadAuditable,
  EntidadBase,
  transformadorEntero,
  transformadorNumerico,
} from './base.entity.js';
import {
  CalidadDatos,
  Canal,
  CanalNotificacion,
  ConectorCondicion,
  EstadoContenido,
  EstadoLlaveApi,
  EstadoPublicacion,
  EstadoQueja,
  EstadoSolicitud,
  EstadoTraduccion,
  EstadoUsuario,
  EstadoVersionFormulario,
  Modalidad,
  ModoEjecucion,
  OperadorCondicion,
  ParteResponsable,
  TipoAuthIntegracion,
  TipoCampo,
  TipoCondicion,
  TipoContacto,
  TipoCosto,
  TipoEnlace,
  TipoFuente,
  TipoIntegracion,
  TipoQueja,
  TipoRecursoAccesibilidad,
  TipoRequisito,
  UnidadTiempo,
} from './enums.js';

// ===========================================================================
// 1. SEGURIDAD / RBAC (CLAUDE.md 9, 17, 19)
// ===========================================================================

@Entity('usuarios')
export class Usuario extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ type: 'text' })
  email: string;

  @Column({ name: 'hash_password', type: 'text' })
  hashPassword: string;

  @Column({ type: 'text' })
  nombres: string;

  @Column({ type: 'text' })
  apellidos: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.PENDIENTE })
  estado: EstadoUsuario;

  @Column({ name: 'email_verificado_en', type: 'timestamptz', nullable: true })
  emailVerificadoEn: Date | null;

  @Column({ name: 'ultimo_acceso_en', type: 'timestamptz', nullable: true })
  ultimoAccesoEn: Date | null;

  @OneToMany(() => UsuarioRol, (asignacion) => asignacion.usuario)
  roles: Relation<UsuarioRol[]>;

  @OneToOne(() => PerfilCiudadano, (perfil) => perfil.usuario)
  perfilCiudadano: Relation<PerfilCiudadano> | null;
}

@Entity('roles')
export class Rol extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ type: 'text' })
  clave: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'es_sistema', type: 'boolean', default: false })
  esSistema: boolean;

  @OneToMany(() => RolPermiso, (rp) => rp.rol)
  permisos: Relation<RolPermiso[]>;
}

@Entity('permisos')
export class Permiso extends EntidadBase {
  @Index({ unique: true })
  @Column({ type: 'text' })
  clave: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'text', nullable: true })
  grupo: string | null;
}

@Entity('roles_permisos')
@Unique(['rolId', 'permisoId'])
export class RolPermiso extends EntidadBase {
  @Index()
  @Column({ name: 'rol_id', type: 'uuid' })
  rolId: string;

  @ManyToOne(() => Rol, (rol) => rol.permisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol: Relation<Rol>;

  @Index()
  @Column({ name: 'permiso_id', type: 'uuid' })
  permisoId: string;

  @ManyToOne(() => Permiso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso: Relation<Permiso>;
}

@Entity('usuarios_roles')
@Unique(['usuarioId', 'rolId', 'institucionId'])
export class UsuarioRol extends EntidadBase {
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Index()
  @Column({ name: 'rol_id', type: 'uuid' })
  rolId: string;

  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol: Relation<Rol>;

  /** Restringe el rol a una institucion (editor institucional, CLAUDE.md 23). */
  @Index()
  @Column({ name: 'institucion_id', type: 'uuid', nullable: true })
  institucionId: string | null;

  @ManyToOne(() => Institucion, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'institucion_id' })
  institucion: Relation<Institucion> | null;

  @Column({ name: 'asignado_por', type: 'uuid', nullable: true })
  asignadoPor: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

@Entity('sesiones')
export class Sesion extends EntidadBase {
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;

  @Column({ name: 'ultima_actividad_en', type: 'timestamptz', nullable: true })
  ultimaActividadEn: Date | null;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expiraEn: Date;

  @Column({ name: 'revocada_en', type: 'timestamptz', nullable: true })
  revocadaEn: Date | null;

  @OneToMany(() => RefreshToken, (token) => token.sesion)
  refreshTokens: Relation<RefreshToken[]>;
}

@Entity('refresh_tokens')
export class RefreshToken extends EntidadBase {
  @Index()
  @Column({ name: 'sesion_id', type: 'uuid' })
  sesionId: string;

  @ManyToOne(() => Sesion, (sesion) => sesion.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sesion_id' })
  sesion: Relation<Sesion>;

  @Index({ unique: true })
  @Column({ name: 'hash_token', type: 'text' })
  hashToken: string;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expiraEn: Date;

  @Column({ name: 'revocado_en', type: 'timestamptz', nullable: true })
  revocadoEn: Date | null;

  /** Token que reemplazo a este durante la rotacion (CLAUDE.md 19). */
  @Column({ name: 'reemplazado_por', type: 'uuid', nullable: true })
  reemplazadoPor: string | null;
}

@Entity('llaves_api')
export class LlaveApi extends EntidadAuditable {
  @Column({ name: 'nombre', type: 'text' })
  nombre: string;

  @Column({ name: 'nombre_desarrollador', type: 'text', nullable: true })
  nombreDesarrollador: string | null;

  @Index()
  @Column({ name: 'propietario_usuario_id', type: 'uuid', nullable: true })
  propietarioUsuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'propietario_usuario_id' })
  propietario: Relation<Usuario> | null;

  /** Prefijo visible de la llave, para identificarla sin exponerla. */
  @Index()
  @Column({ name: 'prefijo_llave', type: 'text' })
  prefijoLlave: string;

  /** Hash de la llave completa. Nunca se guarda en texto plano (CLAUDE.md 17). */
  @Index({ unique: true })
  @Column({ name: 'hash_llave', type: 'text' })
  hashLlave: string;

  @Column({ name: 'limite_tasa', type: 'int', nullable: true })
  limiteTasa: number | null;

  @Column({ type: 'enum', enum: EstadoLlaveApi, default: EstadoLlaveApi.ACTIVA })
  estado: EstadoLlaveApi;

  @Column({ name: 'ultimo_uso_en', type: 'timestamptz', nullable: true })
  ultimoUsoEn: Date | null;

  @Column({ name: 'expira_en', type: 'timestamptz', nullable: true })
  expiraEn: Date | null;

  @Column({ name: 'creada_por', type: 'uuid', nullable: true })
  creadaPor: string | null;

  @OneToMany(() => LlaveApiScope, (scope) => scope.llaveApi)
  scopes: Relation<LlaveApiScope[]>;
}

@Entity('llaves_api_scopes')
@Unique(['llaveApiId', 'scope'])
export class LlaveApiScope extends EntidadBase {
  @Index()
  @Column({ name: 'llave_api_id', type: 'uuid' })
  llaveApiId: string;

  @ManyToOne(() => LlaveApi, (llave) => llave.scopes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'llave_api_id' })
  llaveApi: Relation<LlaveApi>;

  /** Ejemplo: procedures:read, submissions:write (CLAUDE.md 18). */
  @Column({ type: 'text' })
  scope: string;
}

// ===========================================================================
// 2. UBICACIONES GEOGRAFICAS (bd.sql 1)
// ===========================================================================

@Entity('departamentos')
export class Departamento extends EntidadBase {
  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  codigo: string | null;

  @Column({ type: 'text' })
  nombre: string;

  @OneToMany(() => Municipio, (municipio) => municipio.departamento)
  municipios: Relation<Municipio[]>;
}

@Entity('municipios')
export class Municipio extends EntidadBase {
  @Index()
  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId: string;

  @ManyToOne(() => Departamento, (dep) => dep.municipios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Relation<Departamento>;

  @Column({ type: 'text', nullable: true })
  codigo: string | null;

  @Column({ type: 'text' })
  nombre: string;
}

// ===========================================================================
// 3. CATALOGO: INSTITUCIONES Y CATEGORIAS (CLAUDE.md 9)
// ===========================================================================

@Entity('instituciones')
export class Institucion extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  siglas: string | null;

  @Column({ name: 'url_logo', type: 'text', nullable: true })
  urlLogo: string | null;

  @Column({ name: 'sitio_web', type: 'text', nullable: true })
  sitioWeb: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'enum',
    enum: EstadoPublicacion,
    default: EstadoPublicacion.BORRADOR,
  })
  estado: EstadoPublicacion;

  @Column({ name: 'publicado_en', type: 'timestamptz', nullable: true })
  publicadoEn: Date | null;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
  actualizadoPor: string | null;

  @OneToMany(() => InstitucionContacto, (contacto) => contacto.institucion)
  contactos: Relation<InstitucionContacto[]>;

  @OneToMany(() => InstitucionDireccion, (direccion) => direccion.institucion)
  direcciones: Relation<InstitucionDireccion[]>;

  @OneToMany(() => Tramite, (tramite) => tramite.institucion)
  tramites: Relation<Tramite[]>;
}

@Entity('instituciones_contactos')
export class InstitucionContacto extends EntidadBase {
  @Index()
  @Column({ name: 'institucion_id', type: 'uuid' })
  institucionId: string;

  @ManyToOne(() => Institucion, (inst) => inst.contactos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institucion_id' })
  institucion: Relation<Institucion>;

  @Column({ type: 'enum', enum: TipoContacto })
  tipo: TipoContacto;

  @Column({ type: 'text' })
  valor: string;

  @Column({ type: 'text', nullable: true })
  etiqueta: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('instituciones_direcciones')
export class InstitucionDireccion extends EntidadBase {
  @Index()
  @Column({ name: 'institucion_id', type: 'uuid' })
  institucionId: string;

  @ManyToOne(() => Institucion, (inst) => inst.direcciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'institucion_id' })
  institucion: Relation<Institucion>;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId: string | null;

  @ManyToOne(() => Departamento, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Relation<Departamento> | null;

  @Column({ name: 'municipio_id', type: 'uuid', nullable: true })
  municipioId: string | null;

  @ManyToOne(() => Municipio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Relation<Municipio> | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'text', nullable: true })
  referencia: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: transformadorNumerico,
  })
  latitud: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: transformadorNumerico,
  })
  longitud: number | null;

  @Column({ name: 'es_principal', type: 'boolean', default: false })
  esPrincipal: boolean;
}

@Entity('categorias')
export class Categoria extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ name: 'url_icono', type: 'text', nullable: true })
  urlIcono: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({
    type: 'enum',
    enum: EstadoPublicacion,
    default: EstadoPublicacion.BORRADOR,
  })
  estado: EstadoPublicacion;

  @OneToMany(() => CategoriaTraduccion, (t) => t.categoria)
  traducciones: Relation<CategoriaTraduccion[]>;

  @OneToMany(() => TramiteCategoria, (tc) => tc.categoria)
  tramites: Relation<TramiteCategoria[]>;
}

@Entity('categorias_traducciones')
@Unique(['categoriaId', 'idiomaId'])
export class CategoriaTraduccion extends EntidadAuditable {
  @Index()
  @Column({ name: 'categoria_id', type: 'uuid' })
  categoriaId: string;

  @ManyToOne(() => Categoria, (cat) => cat.traducciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria>;

  @Index()
  @Column({ name: 'idioma_id', type: 'uuid' })
  idiomaId: string;

  @ManyToOne(() => Idioma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idioma_id' })
  idioma: Relation<Idioma>;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'enum',
    enum: EstadoTraduccion,
    default: EstadoTraduccion.BORRADOR,
  })
  estado: EstadoTraduccion;

  @Column({ name: 'traducido_por', type: 'uuid', nullable: true })
  traducidoPor: string | null;

  @Column({ name: 'revisado_por', type: 'uuid', nullable: true })
  revisadoPor: string | null;
}

// ===========================================================================
// 4. TRAMITES (CLAUDE.md 12, 13, 14)
// ===========================================================================

@Entity('tramites')
export class Tramite extends EntidadAuditable {
  /** Identificador publico corto, distinto del UUID (CLAUDE.md 33, 37). */
  @Index({ unique: true })
  @Column({ name: 'public_id', type: 'text' })
  publicId: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  /** Codigo interno de la institucion, opcional. */
  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  codigo: string | null;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ name: 'descripcion_corta', type: 'text', nullable: true })
  descripcionCorta: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Index()
  @Column({ name: 'institucion_id', type: 'uuid' })
  institucionId: string;

  @ManyToOne(() => Institucion, (inst) => inst.tramites, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'institucion_id' })
  institucion: Relation<Institucion>;

  @Index()
  @Column({
    type: 'enum',
    enum: EstadoPublicacion,
    default: EstadoPublicacion.BORRADOR,
  })
  estado: EstadoPublicacion;

  /** Que obtiene el ciudadano al finalizar el tramite. */
  @Column({ type: 'text', nullable: true })
  resultado: string | null;

  @Column({
    name: 'modo_ejecucion',
    type: 'enum',
    enum: ModoEjecucion,
    default: ModoEjecucion.SOLO_INFORMACION,
  })
  modoEjecucion: ModoEjecucion;

  @Column({ type: 'enum', enum: Modalidad, nullable: true })
  modalidad: Modalidad | null;

  @Column({ name: 'dirigido_a', type: 'text', nullable: true })
  dirigidoA: string | null;

  @Column({ name: 'disponible_en_linea', type: 'boolean', default: false })
  disponibleEnLinea: boolean;

  @Column({ name: 'url_externa', type: 'text', nullable: true })
  urlExterna: string | null;

  @Column({ name: 'url_fuente_oficial', type: 'text', nullable: true })
  urlFuenteOficial: string | null;

  @Column({
    name: 'tipo_costo',
    type: 'enum',
    enum: TipoCosto,
    default: TipoCosto.DESCONOCIDO,
  })
  tipoCosto: TipoCosto;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: transformadorNumerico,
  })
  costo: number | null;

  @Column({ type: 'text', default: 'GTQ' })
  moneda: string;

  @Column({ name: 'tiempo_respuesta_valor', type: 'int', nullable: true })
  tiempoRespuestaValor: number | null;

  @Column({
    name: 'tiempo_respuesta_unidad',
    type: 'enum',
    enum: UnidadTiempo,
    nullable: true,
  })
  tiempoRespuestaUnidad: UnidadTiempo | null;

  /** Texto libre heredado de bd.sql cuando no hay valor/unidad estructurados. */
  @Column({ name: 'tiempo_respuesta_texto', type: 'text', nullable: true })
  tiempoRespuestaTexto: string | null;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string | null;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: string | null;

  @Column({ name: 'periodo_validez', type: 'text', nullable: true })
  periodoValidez: string | null;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId: string | null;

  @ManyToOne(() => Departamento, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Relation<Departamento> | null;

  @Column({ name: 'municipio_id', type: 'uuid', nullable: true })
  municipioId: string | null;

  @ManyToOne(() => Municipio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Relation<Municipio> | null;

  @Column({
    name: 'calidad_datos',
    type: 'enum',
    enum: CalidadDatos,
    default: CalidadDatos.PARCIAL,
  })
  calidadDatos: CalidadDatos;

  @Column({
    name: 'tipo_fuente',
    type: 'enum',
    enum: TipoFuente,
    default: TipoFuente.OFICIAL,
  })
  tipoFuente: TipoFuente;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string | null;

  @Column({ name: 'source_updated_at', type: 'timestamptz', nullable: true })
  sourceUpdatedAt: Date | null;

  @Column({ name: 'importado_en', type: 'timestamptz', nullable: true })
  importadoEn: Date | null;

  @Column({ name: 'ultima_verificacion_en', type: 'timestamptz', nullable: true })
  ultimaVerificacionEn: Date | null;

  @Column({ name: 'verificado_por', type: 'uuid', nullable: true })
  verificadoPor: string | null;

  /** Contador de vistas para estadisticas de tramites mas consultados (CLAUDE.md 34). */
  @Column({ type: 'bigint', default: 0, transformer: transformadorEntero })
  vistas: number;

  @Column({ name: 'publicado_en', type: 'timestamptz', nullable: true })
  publicadoEn: Date | null;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
  actualizadoPor: string | null;

  @OneToMany(() => TramiteCategoria, (tc) => tc.tramite)
  categorias: Relation<TramiteCategoria[]>;

  @OneToMany(() => TramiteTraduccion, (t) => t.tramite)
  traducciones: Relation<TramiteTraduccion[]>;

  @OneToMany(() => TramiteRequisito, (r) => r.tramite)
  requisitos: Relation<TramiteRequisito[]>;

  @OneToMany(() => TramitePaso, (p) => p.tramite)
  pasos: Relation<TramitePaso[]>;

  @OneToMany(() => TramiteNormativa, (n) => n.tramite)
  normativas: Relation<TramiteNormativa[]>;

  @OneToMany(() => TramiteEnlace, (e) => e.tramite)
  enlaces: Relation<TramiteEnlace[]>;

  @OneToMany(() => TramiteCosto, (c) => c.tramite)
  costos: Relation<TramiteCosto[]>;

  @OneToMany(() => TramiteTiempo, (t) => t.tramite)
  tiempos: Relation<TramiteTiempo[]>;

  @OneToMany(() => TramiteDisponibilidad, (d) => d.tramite)
  disponibilidad: Relation<TramiteDisponibilidad[]>;

  @OneToMany(() => TramiteVersion, (v) => v.tramite)
  versiones: Relation<TramiteVersion[]>;

  @OneToMany(() => TramiteIntegracion, (i) => i.tramite)
  integraciones: Relation<TramiteIntegracion[]>;

  @OneToMany(() => VideoSenas, (v) => v.tramite)
  videosSenas: Relation<VideoSenas[]>;

  @OneToMany(() => RecursoAccesibilidad, (r) => r.tramite)
  recursosAccesibilidad: Relation<RecursoAccesibilidad[]>;

  @OneToMany(() => TramiteHistorialEstado, (h) => h.tramite)
  historialEstado: Relation<TramiteHistorialEstado[]>;

  @OneToOne(() => Formulario, (formulario) => formulario.tramite)
  formulario: Relation<Formulario> | null;
}

@Entity('tramites_categorias')
@Unique(['tramiteId', 'categoriaId'])
export class TramiteCategoria extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.categorias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Index()
  @Column({ name: 'categoria_id', type: 'uuid' })
  categoriaId: string;

  @ManyToOne(() => Categoria, (c) => c.tramites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria>;

  @Column({ name: 'es_principal', type: 'boolean', default: false })
  esPrincipal: boolean;
}

@Entity('tramites_traducciones')
@Unique(['tramiteId', 'idiomaId'])
export class TramiteTraduccion extends EntidadAuditable {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.traducciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Index()
  @Column({ name: 'idioma_id', type: 'uuid' })
  idiomaId: string;

  @ManyToOne(() => Idioma, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idioma_id' })
  idioma: Relation<Idioma>;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ name: 'descripcion_corta', type: 'text', nullable: true })
  descripcionCorta: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'descripcion_requisitos', type: 'text', nullable: true })
  descripcionRequisitos: string | null;

  @Column({ name: 'descripcion_pasos', type: 'text', nullable: true })
  descripcionPasos: string | null;

  @Column({ name: 'seo_titulo', type: 'text', nullable: true })
  seoTitulo: string | null;

  @Column({ name: 'seo_descripcion', type: 'text', nullable: true })
  seoDescripcion: string | null;

  @Column({
    type: 'enum',
    enum: EstadoTraduccion,
    default: EstadoTraduccion.BORRADOR,
  })
  estado: EstadoTraduccion;

  @Column({ name: 'traducido_por', type: 'uuid', nullable: true })
  traducidoPor: string | null;

  @Column({ name: 'revisado_por', type: 'uuid', nullable: true })
  revisadoPor: string | null;
}

@Entity('tramites_historial_estado')
export class TramiteHistorialEstado extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.historialEstado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({
    name: 'estado_anterior',
    type: 'enum',
    enum: EstadoPublicacion,
    nullable: true,
  })
  estadoAnterior: EstadoPublicacion | null;

  @Column({ name: 'estado_nuevo', type: 'enum', enum: EstadoPublicacion })
  estadoNuevo: EstadoPublicacion;

  @Column({ name: 'cambiado_por', type: 'uuid', nullable: true })
  cambiadoPor: string | null;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

@Entity('tramites_requisitos')
export class TramiteRequisito extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.requisitos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'enum', enum: TipoRequisito, default: TipoRequisito.DOCUMENTO })
  tipo: TipoRequisito;

  @Column({ name: 'es_obligatorio', type: 'boolean', default: true })
  esObligatorio: boolean;

  @Column({ type: 'int', nullable: true })
  cantidad: number | null;

  @Column({ name: 'requiere_archivo', type: 'boolean', default: false })
  requiereArchivo: boolean;

  @Column({
    name: 'tipos_archivo_permitidos',
    type: 'text',
    array: true,
    nullable: true,
  })
  tiposArchivoPermitidos: string[] | null;

  @Column({ name: 'dias_validez', type: 'int', nullable: true })
  diasValidez: number | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('tramites_pasos')
export class TramitePaso extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.pasos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    name: 'parte_responsable',
    type: 'enum',
    enum: ParteResponsable,
    default: ParteResponsable.CIUDADANO,
  })
  parteResponsable: ParteResponsable;

  @Column({ name: 'tiempo_estimado', type: 'text', nullable: true })
  tiempoEstimado: string | null;

  @Column({ type: 'enum', enum: Canal, nullable: true })
  canal: Canal | null;

  @Column({ type: 'text', nullable: true })
  ubicacion: string | null;

  @Column({ name: 'requiere_pago', type: 'boolean', default: false })
  requierePago: boolean;

  @Column({ name: 'requiere_documento', type: 'boolean', default: false })
  requiereDocumento: boolean;

  @Column({ name: 'url_externa', type: 'text', nullable: true })
  urlExterna: string | null;
}

@Entity('tramites_normativas')
export class TramiteNormativa extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.normativas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  tipo: string | null;

  @Column({ type: 'text', nullable: true })
  numero: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'date', nullable: true })
  fecha: string | null;

  @Column({ type: 'text', nullable: true })
  extracto: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('tramites_enlaces')
export class TramiteEnlace extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.enlaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'enum', enum: TipoEnlace, default: TipoEnlace.INFORMACION })
  tipo: TipoEnlace;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('tramites_costos')
export class TramiteCosto extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.costos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'text' })
  concepto: string;

  @Column({
    name: 'tipo_costo',
    type: 'enum',
    enum: TipoCosto,
    default: TipoCosto.FIJO,
  })
  tipoCosto: TipoCosto;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: transformadorNumerico,
  })
  monto: number | null;

  @Column({ type: 'text', default: 'GTQ' })
  moneda: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('tramites_tiempos')
export class TramiteTiempo extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.tiempos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'text' })
  concepto: string;

  @Column({ type: 'int', nullable: true })
  valor: number | null;

  @Column({ type: 'enum', enum: UnidadTiempo, nullable: true })
  unidad: UnidadTiempo | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;
}

@Entity('tramites_disponibilidad')
export class TramiteDisponibilidad extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.disponibilidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId: string | null;

  @Column({ name: 'municipio_id', type: 'uuid', nullable: true })
  municipioId: string | null;

  @Column({ name: 'institucion_id', type: 'uuid', nullable: true })
  institucionId: string | null;

  @Column({ type: 'enum', enum: Canal, nullable: true })
  canal: Canal | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

@Entity('tramites_versiones')
@Unique(['tramiteId', 'version'])
export class TramiteVersion extends EntidadBase {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.versiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'int' })
  version: number;

  /** Copia completa del tramite en el momento de publicar (CLAUDE.md 26). */
  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;

  @Column({ name: 'publicado_en', type: 'timestamptz', nullable: true })
  publicadoEn: Date | null;
}

@Entity('tramites_integraciones')
export class TramiteIntegracion extends EntidadAuditable {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.integraciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ name: 'tipo_integracion', type: 'enum', enum: TipoIntegracion })
  tipoIntegracion: TipoIntegracion;

  @Column({ name: 'base_url', type: 'text', nullable: true })
  baseUrl: string | null;

  @Column({ type: 'text', nullable: true })
  endpoint: string | null;

  @Column({
    name: 'tipo_auth',
    type: 'enum',
    enum: TipoAuthIntegracion,
    default: TipoAuthIntegracion.NINGUNO,
  })
  tipoAuth: TipoAuthIntegracion;

  /**
   * Configuracion no sensible de la integracion. Los secretos institucionales
   * nunca se guardan aqui ni se envian al frontend (CLAUDE.md 15).
   */
  @Column({ type: 'jsonb', nullable: true })
  configuracion: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  activo: boolean;
}

// ===========================================================================
// 5. ACCESIBILIDAD Y TRADUCCIONES (CLAUDE.md 10, 11)
// ===========================================================================

@Entity('idiomas')
export class Idioma extends EntidadBase {
  /** Codigo ISO 639 (es, quc, kek, cak, mam, ...). */
  @Index({ unique: true })
  @Column({ type: 'text' })
  codigo: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ name: 'nombre_nativo', type: 'text', nullable: true })
  nombreNativo: string | null;

  @Column({ name: 'es_maya', type: 'boolean', default: false })
  esMaya: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

@Entity('tramites_videos_senas')
export class VideoSenas extends EntidadAuditable {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.videosSenas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ name: 'lengua_senas', type: 'text', default: 'LENSEGUA' })
  lenguaSenas: string;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'url_video', type: 'text' })
  urlVideo: string;

  @Column({ name: 'url_miniatura', type: 'text', nullable: true })
  urlMiniatura: string | null;

  @Column({ name: 'duracion_segundos', type: 'int', nullable: true })
  duracionSegundos: number | null;

  @Column({ type: 'text', nullable: true })
  transcripcion: string | null;

  @Column({
    type: 'enum',
    enum: EstadoContenido,
    default: EstadoContenido.BORRADOR,
  })
  estado: EstadoContenido;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @Column({ name: 'aprobado_por', type: 'uuid', nullable: true })
  aprobadoPor: string | null;
}

@Entity('tramites_recursos_accesibilidad')
export class RecursoAccesibilidad extends EntidadAuditable {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, (t) => t.recursosAccesibilidad, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'enum', enum: TipoRecursoAccesibilidad })
  tipo: TipoRecursoAccesibilidad;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  contenido: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ name: 'idioma_id', type: 'uuid', nullable: true })
  idiomaId: string | null;

  @ManyToOne(() => Idioma, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'idioma_id' })
  idioma: Relation<Idioma> | null;

  @Column({
    type: 'enum',
    enum: EstadoContenido,
    default: EstadoContenido.BORRADOR,
  })
  estado: EstadoContenido;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;
}

// ===========================================================================
// 6. FORMULARIOS DINAMICOS (CLAUDE.md 7, 8, 52, 53)
// ===========================================================================

@Entity('formularios')
export class Formulario extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @OneToOne(() => Tramite, (tramite) => tramite.formulario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'esta_activo', type: 'boolean', default: true })
  estaActivo: boolean;

  /** Version publicada vigente. */
  @Column({ name: 'version_actual_id', type: 'uuid', nullable: true })
  versionActualId: string | null;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @OneToMany(() => FormularioVersion, (v) => v.formulario)
  versiones: Relation<FormularioVersion[]>;
}

@Entity('formularios_versiones')
@Unique(['formularioId', 'version'])
export class FormularioVersion extends EntidadBase {
  @Index()
  @Column({ name: 'formulario_id', type: 'uuid' })
  formularioId: string;

  @ManyToOne(() => Formulario, (f) => f.versiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formulario_id' })
  formulario: Relation<Formulario>;

  @Column({ type: 'int' })
  version: number;

  @Column({
    type: 'enum',
    enum: EstadoVersionFormulario,
    default: EstadoVersionFormulario.BORRADOR,
  })
  estado: EstadoVersionFormulario;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'publicado_por', type: 'uuid', nullable: true })
  publicadoPor: string | null;

  @Column({ name: 'creado_por', type: 'uuid', nullable: true })
  creadoPor: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;

  @Column({ name: 'publicado_en', type: 'timestamptz', nullable: true })
  publicadoEn: Date | null;

  @OneToMany(() => FormularioSeccion, (s) => s.formularioVersion)
  secciones: Relation<FormularioSeccion[]>;

  @OneToMany(() => FormularioCampo, (c) => c.formularioVersion)
  campos: Relation<FormularioCampo[]>;
}

@Entity('formularios_secciones')
@Unique(['formularioVersionId', 'clave'])
export class FormularioSeccion extends EntidadBase {
  @Index()
  @Column({ name: 'formulario_version_id', type: 'uuid' })
  formularioVersionId: string;

  @ManyToOne(() => FormularioVersion, (v) => v.secciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formulario_version_id' })
  formularioVersion: Relation<FormularioVersion>;

  @Column({ type: 'text' })
  clave: string;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

@Entity('formularios_campos')
@Unique(['formularioVersionId', 'clave'])
export class FormularioCampo extends EntidadBase {
  @Index()
  @Column({ name: 'formulario_version_id', type: 'uuid' })
  formularioVersionId: string;

  @ManyToOne(() => FormularioVersion, (v) => v.campos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formulario_version_id' })
  formularioVersion: Relation<FormularioVersion>;

  @Column({ name: 'seccion_id', type: 'uuid', nullable: true })
  seccionId: string | null;

  @ManyToOne(() => FormularioSeccion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seccion_id' })
  seccion: Relation<FormularioSeccion> | null;

  /** Nombre interno de la variable (CLAUDE.md 6). */
  @Column({ type: 'text' })
  clave: string;

  /** Texto visible en el frontend. */
  @Column({ type: 'text' })
  etiqueta: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'text', nullable: true })
  placeholder: string | null;

  @Column({ type: 'enum', enum: TipoCampo })
  tipo: TipoCampo;

  @Column({ name: 'es_requerido', type: 'boolean', default: false })
  esRequerido: boolean;

  @Column({ name: 'valor_defecto', type: 'text', nullable: true })
  valorDefecto: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /** Reglas de validacion declarativas: { minLength, maxLength, pattern, ... }. */
  @Column({ type: 'jsonb', nullable: true })
  validacion: Record<string, unknown> | null;

  @Column({ name: 'visibilidad_condicional', type: 'jsonb', nullable: true })
  visibilidadCondicional: Record<string, unknown> | null;

  @Column({ name: 'requerido_condicional', type: 'jsonb', nullable: true })
  requeridoCondicional: Record<string, unknown> | null;

  @Column({ name: 'texto_ayuda', type: 'text', nullable: true })
  textoAyuda: string | null;

  @Column({
    name: 'tipos_archivo_permitidos',
    type: 'text',
    array: true,
    nullable: true,
  })
  tiposArchivoPermitidos: string[] | null;

  @Column({ name: 'tamano_max_archivo', type: 'int', nullable: true })
  tamanoMaxArchivo: number | null;

  @Column({ type: 'boolean', default: false })
  multiple: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @OneToMany(() => FormularioCampoOpcion, (o) => o.campo)
  opciones: Relation<FormularioCampoOpcion[]>;

  @OneToMany(() => FormularioCampoCondicion, (c) => c.campo)
  condiciones: Relation<FormularioCampoCondicion[]>;
}

@Entity('formularios_campos_opciones')
export class FormularioCampoOpcion extends EntidadBase {
  @Index()
  @Column({ name: 'campo_id', type: 'uuid' })
  campoId: string;

  @ManyToOne(() => FormularioCampo, (c) => c.opciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campo_id' })
  campo: Relation<FormularioCampo>;

  @Column({ type: 'text' })
  valor: string;

  @Column({ type: 'text' })
  etiqueta: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

@Entity('formularios_campos_condiciones')
export class FormularioCampoCondicion extends EntidadBase {
  @Index()
  @Column({ name: 'campo_id', type: 'uuid' })
  campoId: string;

  @ManyToOne(() => FormularioCampo, (c) => c.condiciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campo_id' })
  campo: Relation<FormularioCampo>;

  @Column({ name: 'tipo_condicion', type: 'enum', enum: TipoCondicion })
  tipoCondicion: TipoCondicion;

  /** Clave del campo que se evalua. */
  @Column({ name: 'campo_objetivo_clave', type: 'text' })
  campoObjetivoClave: string;

  @Column({ type: 'enum', enum: OperadorCondicion })
  operador: OperadorCondicion;

  @Column({ type: 'text', nullable: true })
  valor: string | null;

  @Column({ type: 'enum', enum: ConectorCondicion, default: ConectorCondicion.Y })
  conector: ConectorCondicion;

  @Column({ type: 'int', default: 0 })
  orden: number;
}

// ===========================================================================
// 7. SOLICITUDES DE CIUDADANOS (CLAUDE.md 36, 37, 54, 55)
// ===========================================================================

@Entity('perfiles_ciudadano')
export class PerfilCiudadano extends EntidadAuditable {
  @Index({ unique: true })
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @OneToOne(() => Usuario, (usuario) => usuario.perfilCiudadano, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  dpi: string | null;

  @Column({ type: 'text' })
  nombres: string;

  @Column({ type: 'text' })
  apellidos: string;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId: string | null;

  @ManyToOne(() => Departamento, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Relation<Departamento> | null;

  @Column({ name: 'municipio_id', type: 'uuid', nullable: true })
  municipioId: string | null;

  @ManyToOne(() => Municipio, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Relation<Municipio> | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;
}

@Entity('solicitudes')
export class Solicitud extends EntidadAuditable {
  /** Numero de expediente publico, ej. GT-2026-000001 (CLAUDE.md 37). */
  @Index({ unique: true })
  @Column({ name: 'referencia_publica', type: 'text' })
  referenciaPublica: string;

  @Index()
  @Column({ name: 'tramite_id', type: 'uuid' })
  tramiteId: string;

  @ManyToOne(() => Tramite, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite>;

  /** Version del formulario usada al enviar; nunca cambia despues (CLAUDE.md 53). */
  @Index()
  @Column({ name: 'formulario_version_id', type: 'uuid', nullable: true })
  formularioVersionId: string | null;

  @ManyToOne(() => FormularioVersion, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'formulario_version_id' })
  formularioVersion: Relation<FormularioVersion> | null;

  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Index()
  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.BORRADOR,
  })
  estado: EstadoSolicitud;

  /** Valores enviados por el ciudadano (CLAUDE.md 8). */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  datos: Record<string, unknown>;

  @Column({ name: 'enviada_en', type: 'timestamptz', nullable: true })
  enviadaEn: Date | null;

  @OneToMany(() => SolicitudArchivo, (a) => a.solicitud)
  archivos: Relation<SolicitudArchivo[]>;

  @OneToMany(() => SolicitudHistorialEstado, (h) => h.solicitud)
  historialEstado: Relation<SolicitudHistorialEstado[]>;
}

@Entity('solicitudes_archivos')
export class SolicitudArchivo extends EntidadBase {
  @Index()
  @Column({ name: 'solicitud_id', type: 'uuid' })
  solicitudId: string;

  @ManyToOne(() => Solicitud, (s) => s.archivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Relation<Solicitud>;

  /** Clave del campo de formulario al que corresponde el archivo. */
  @Column({ name: 'campo_clave', type: 'text' })
  campoClave: string;

  @Column({ name: 'archivo_id', type: 'uuid' })
  archivoId: string;

  @ManyToOne(() => Archivo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'archivo_id' })
  archivo: Relation<Archivo>;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

@Entity('solicitudes_historial_estado')
export class SolicitudHistorialEstado extends EntidadBase {
  @Index()
  @Column({ name: 'solicitud_id', type: 'uuid' })
  solicitudId: string;

  @ManyToOne(() => Solicitud, (s) => s.historialEstado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Relation<Solicitud>;

  @Column({ name: 'estado_anterior', type: 'text', nullable: true })
  estadoAnterior: string | null;

  @Column({ name: 'estado_nuevo', type: 'text' })
  estadoNuevo: string;

  @Column({ name: 'cambiado_por', type: 'uuid', nullable: true })
  cambiadoPor: string | null;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

// ===========================================================================
// 8. ARCHIVOS (CLAUDE.md 35)
// ===========================================================================

@Entity('archivos')
export class Archivo extends EntidadBase {
  @Column({ type: 'text' })
  bucket: string;

  @Column({ type: 'text' })
  ruta: string;

  @Column({ name: 'nombre_original', type: 'text' })
  nombreOriginal: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @Column({
    name: 'tamano_bytes',
    type: 'bigint',
    transformer: transformadorEntero,
  })
  tamanoBytes: number;

  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  @Column({ name: 'es_publico', type: 'boolean', default: false })
  esPublico: boolean;

  @Column({ name: 'subido_por', type: 'uuid', nullable: true })
  subidoPor: string | null;

  /** Referencia polimorfica opcional a la entidad duena del archivo. */
  @Column({ name: 'entidad_tipo', type: 'text', nullable: true })
  entidadTipo: string | null;

  @Column({ name: 'entidad_id', type: 'uuid', nullable: true })
  entidadId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;

  @OneToMany(() => ArchivoVersion, (v) => v.archivo)
  versiones: Relation<ArchivoVersion[]>;
}

@Entity('archivos_versiones')
@Unique(['archivoId', 'version'])
export class ArchivoVersion extends EntidadBase {
  @Index()
  @Column({ name: 'archivo_id', type: 'uuid' })
  archivoId: string;

  @ManyToOne(() => Archivo, (a) => a.versiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'archivo_id' })
  archivo: Relation<Archivo>;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text' })
  ruta: string;

  @Column({
    name: 'tamano_bytes',
    type: 'bigint',
    transformer: transformadorEntero,
  })
  tamanoBytes: number;

  @Column({ type: 'text', nullable: true })
  checksum: string | null;

  @Column({ name: 'subido_por', type: 'uuid', nullable: true })
  subidoPor: string | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

// ===========================================================================
// 9. AUDITORIA Y SISTEMA (CLAUDE.md 27, 34, 56)
// ===========================================================================

@Entity('registros_auditoria')
export class RegistroAuditoria extends EntidadBase {
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ type: 'text' })
  accion: string;

  @Index()
  @Column({ type: 'text' })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'text', nullable: true })
  entidadId: string | null;

  @Column({ name: 'valores_anteriores', type: 'jsonb', nullable: true })
  valoresAnteriores: Record<string, unknown> | null;

  @Column({ name: 'valores_nuevos', type: 'jsonb', nullable: true })
  valoresNuevos: Record<string, unknown> | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'request_id', type: 'text', nullable: true })
  requestId: string | null;

  @Index()
  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

@Entity('notificaciones')
export class Notificacion extends EntidadBase {
  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ type: 'text' })
  tipo: string;

  @Column({
    type: 'enum',
    enum: CanalNotificacion,
    default: CanalNotificacion.WEB,
  })
  canal: CanalNotificacion;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'entidad_tipo', type: 'text', nullable: true })
  entidadTipo: string | null;

  @Column({ name: 'entidad_id', type: 'uuid', nullable: true })
  entidadId: string | null;

  @Column({ name: 'leida_en', type: 'timestamptz', nullable: true })
  leidaEn: Date | null;

  @Column({ name: 'enviada_en', type: 'timestamptz', nullable: true })
  enviadaEn: Date | null;

  @Column({ name: 'fecha_creacion', type: 'timestamptz', default: () => 'now()' })
  fechaCreacion: Date;
}

@Entity('configuracion_sistema')
export class ConfiguracionSistema extends EntidadBase {
  @Index({ unique: true })
  @Column({ type: 'text' })
  clave: string;

  @Column({ type: 'jsonb' })
  valor: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'actualizado_por', type: 'uuid', nullable: true })
  actualizadoPor: string | null;

  @Column({
    name: 'fecha_actualizacion',
    type: 'timestamptz',
    default: () => 'now()',
  })
  fechaActualizacion: Date;
}

@Entity('quejas_denuncias')
export class QuejaDenuncia extends EntidadAuditable {
  @Index()
  @Column({ name: 'tramite_id', type: 'uuid', nullable: true })
  tramiteId: string | null;

  @ManyToOne(() => Tramite, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Relation<Tramite> | null;

  @Index()
  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario> | null;

  @Column({ type: 'enum', enum: TipoQueja, default: TipoQueja.QUEJA })
  tipo: TipoQueja;

  @Column({ type: 'text' })
  descripcion: string;

  /** Contacto para dar seguimiento cuando el reporte es anonimo. */
  @Column({ type: 'text', nullable: true })
  contacto: string | null;

  @Column({ type: 'enum', enum: EstadoQueja, default: EstadoQueja.ABIERTA })
  estado: EstadoQueja;

  @Column({ type: 'text', nullable: true })
  respuesta: string | null;

  @Column({ name: 'atendido_por', type: 'uuid', nullable: true })
  atendidoPor: string | null;
}
