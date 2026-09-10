import { PERMISOS, ROLES } from '../../modules/auth/auth.constants.js';

/** Catalogo de permisos con descripcion, para sembrar `permisos` (CLAUDE.md 18). */
export const PERMISOS_SEED: { clave: string; descripcion: string; grupo: string }[] =
  [
    { clave: PERMISOS.INSTITUCIONES_LEER, descripcion: 'Ver instituciones', grupo: 'catalogo' },
    { clave: PERMISOS.INSTITUCIONES_ESCRIBIR, descripcion: 'Administrar instituciones', grupo: 'catalogo' },
    { clave: PERMISOS.CATEGORIAS_LEER, descripcion: 'Ver categorias', grupo: 'catalogo' },
    { clave: PERMISOS.CATEGORIAS_ESCRIBIR, descripcion: 'Administrar categorias', grupo: 'catalogo' },
    { clave: PERMISOS.TRAMITES_LEER, descripcion: 'Ver tramites en administracion', grupo: 'catalogo' },
    { clave: PERMISOS.TRAMITES_ESCRIBIR, descripcion: 'Crear y editar tramites', grupo: 'catalogo' },
    { clave: PERMISOS.TRAMITES_PUBLICAR, descripcion: 'Publicar y archivar tramites', grupo: 'catalogo' },
    { clave: PERMISOS.TRADUCCIONES_LEER, descripcion: 'Ver traducciones', grupo: 'accesibilidad' },
    { clave: PERMISOS.TRADUCCIONES_ESCRIBIR, descripcion: 'Administrar traducciones', grupo: 'accesibilidad' },
    { clave: PERMISOS.ACCESIBILIDAD_LEER, descripcion: 'Ver recursos de accesibilidad', grupo: 'accesibilidad' },
    { clave: PERMISOS.ACCESIBILIDAD_ESCRIBIR, descripcion: 'Administrar recursos de accesibilidad', grupo: 'accesibilidad' },
    { clave: PERMISOS.FORMULARIOS_ESCRIBIR, descripcion: 'Administrar formularios dinamicos', grupo: 'formularios' },
    { clave: PERMISOS.SOLICITUDES_LEER, descripcion: 'Ver solicitudes', grupo: 'solicitudes' },
    { clave: PERMISOS.SOLICITUDES_ESCRIBIR, descripcion: 'Crear solicitudes', grupo: 'solicitudes' },
    { clave: PERMISOS.USUARIOS_ADMINISTRAR, descripcion: 'Administrar usuarios y roles', grupo: 'seguridad' },
    { clave: PERMISOS.LLAVES_API_ADMINISTRAR, descripcion: 'Administrar llaves de API', grupo: 'seguridad' },
    { clave: PERMISOS.AUDITORIA_LEER, descripcion: 'Consultar la auditoria', grupo: 'seguridad' },
  ];

const TODOS = PERMISOS_SEED.map((p) => p.clave);

/** Roles base y sus permisos (CLAUDE.md 23). */
export const ROLES_SEED: {
  clave: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}[] = [
  {
    clave: ROLES.SUPER_ADMIN,
    nombre: 'Super administrador',
    descripcion: 'Control total: seguridad, usuarios y configuracion',
    permisos: TODOS,
  },
  {
    clave: ROLES.ADMIN_NACIONAL,
    nombre: 'Administrador nacional',
    descripcion: 'Administra todo el catalogo nacional',
    permisos: TODOS.filter(
      (p) =>
        p !== PERMISOS.USUARIOS_ADMINISTRAR &&
        p !== PERMISOS.LLAVES_API_ADMINISTRAR,
    ),
  },
  {
    clave: ROLES.EDITOR_INSTITUCIONAL,
    nombre: 'Editor institucional',
    descripcion: 'Administra la informacion de su institucion',
    permisos: [
      PERMISOS.INSTITUCIONES_LEER,
      PERMISOS.CATEGORIAS_LEER,
      PERMISOS.TRAMITES_LEER,
      PERMISOS.TRAMITES_ESCRIBIR,
      PERMISOS.TRADUCCIONES_LEER,
      PERMISOS.TRADUCCIONES_ESCRIBIR,
      PERMISOS.ACCESIBILIDAD_LEER,
      PERMISOS.ACCESIBILIDAD_ESCRIBIR,
      PERMISOS.FORMULARIOS_ESCRIBIR,
      PERMISOS.SOLICITUDES_LEER,
    ],
  },
  {
    clave: ROLES.CIUDADANO,
    nombre: 'Ciudadano',
    descripcion: 'Puede iniciar y consultar sus propias solicitudes',
    permisos: [PERMISOS.SOLICITUDES_ESCRIBIR, PERMISOS.SOLICITUDES_LEER],
  },
];

/** Idiomas iniciales (CLAUDE.md 10). Codigos ISO 639-3. */
export const IDIOMAS_SEED: {
  codigo: string;
  nombre: string;
  nombreNativo: string;
  esMaya: boolean;
  orden: number;
}[] = [
  { codigo: 'es', nombre: 'Espanol', nombreNativo: 'Espanol', esMaya: false, orden: 0 },
  { codigo: 'quc', nombre: 'K iche', nombreNativo: "K'iche'", esMaya: true, orden: 1 },
  { codigo: 'kek', nombre: 'Q eqchi', nombreNativo: "Q'eqchi'", esMaya: true, orden: 2 },
  { codigo: 'cak', nombre: 'Kaqchikel', nombreNativo: 'Kaqchikel', esMaya: true, orden: 3 },
  { codigo: 'mam', nombre: 'Mam', nombreNativo: 'Mam', esMaya: true, orden: 4 },
];

/** 22 departamentos de Guatemala con su codigo INE y su cabecera. */
export const DEPARTAMENTOS_SEED: {
  codigo: string;
  nombre: string;
  cabecera: string;
}[] = [
  { codigo: '01', nombre: 'Guatemala', cabecera: 'Guatemala' },
  { codigo: '02', nombre: 'El Progreso', cabecera: 'Guastatoya' },
  { codigo: '03', nombre: 'Sacatepequez', cabecera: 'Antigua Guatemala' },
  { codigo: '04', nombre: 'Chimaltenango', cabecera: 'Chimaltenango' },
  { codigo: '05', nombre: 'Escuintla', cabecera: 'Escuintla' },
  { codigo: '06', nombre: 'Santa Rosa', cabecera: 'Cuilapa' },
  { codigo: '07', nombre: 'Solola', cabecera: 'Solola' },
  { codigo: '08', nombre: 'Totonicapan', cabecera: 'Totonicapan' },
  { codigo: '09', nombre: 'Quetzaltenango', cabecera: 'Quetzaltenango' },
  { codigo: '10', nombre: 'Suchitepequez', cabecera: 'Mazatenango' },
  { codigo: '11', nombre: 'Retalhuleu', cabecera: 'Retalhuleu' },
  { codigo: '12', nombre: 'San Marcos', cabecera: 'San Marcos' },
  { codigo: '13', nombre: 'Huehuetenango', cabecera: 'Huehuetenango' },
  { codigo: '14', nombre: 'Quiche', cabecera: 'Santa Cruz del Quiche' },
  { codigo: '15', nombre: 'Baja Verapaz', cabecera: 'Salama' },
  { codigo: '16', nombre: 'Alta Verapaz', cabecera: 'Coban' },
  { codigo: '17', nombre: 'Peten', cabecera: 'Flores' },
  { codigo: '18', nombre: 'Izabal', cabecera: 'Puerto Barrios' },
  { codigo: '19', nombre: 'Zacapa', cabecera: 'Zacapa' },
  { codigo: '20', nombre: 'Chiquimula', cabecera: 'Chiquimula' },
  { codigo: '21', nombre: 'Jalapa', cabecera: 'Jalapa' },
  { codigo: '22', nombre: 'Jutiapa', cabecera: 'Jutiapa' },
];

/** Instituciones de ejemplo (CLAUDE.md 59). No es informacion oficial verificada. */
export const INSTITUCIONES_SEED: {
  slug: string;
  nombre: string;
  siglas: string;
  sitioWeb: string;
}[] = [
  {
    slug: 'ministerio-de-economia',
    nombre: 'Ministerio de Economia',
    siglas: 'MINECO',
    sitioWeb: 'https://www.mineco.gob.gt',
  },
  {
    slug: 'conadi',
    nombre:
      'Consejo Nacional para la Atencion de las Personas con Discapacidad',
    siglas: 'CONADI',
    sitioWeb: 'https://www.conadi.gob.gt',
  },
  {
    slug: 'conred',
    nombre: 'Coordinadora Nacional para la Reduccion de Desastres',
    siglas: 'CONRED',
    sitioWeb: 'https://conred.gob.gt',
  },
  {
    slug: 'conap',
    nombre: 'Consejo Nacional de Areas Protegidas',
    siglas: 'CONAP',
    sitioWeb: 'https://www.conap.gob.gt',
  },
  {
    slug: 'amsa',
    nombre:
      'Autoridad para el Manejo Sustentable de la Cuenca y del Lago de Amatitlan',
    siglas: 'AMSA',
    sitioWeb: 'https://amsa.gob.gt',
  },
  {
    slug: 'amsclae',
    nombre:
      'Autoridad para el Manejo Sustentable de la Cuenca del Lago de Atitlan y su Entorno',
    siglas: 'AMSCLAE',
    sitioWeb: 'https://amsclae.gob.gt',
  },
];

/** Categorias iniciales (CLAUDE.md 59). */
export const CATEGORIAS_SEED: { slug: string; nombre: string; orden: number }[] =
  [
    { slug: 'medio-ambiente', nombre: 'Medio Ambiente', orden: 1 },
    { slug: 'economia', nombre: 'Economia', orden: 2 },
    { slug: 'trabajo', nombre: 'Trabajo', orden: 3 },
    {
      slug: 'educacion-cultura-y-deporte',
      nombre: 'Educacion, Cultura y Deporte',
      orden: 4,
    },
    { slug: 'seguridad', nombre: 'Seguridad', orden: 5 },
    { slug: 'energia', nombre: 'Energia', orden: 6 },
    {
      slug: 'comunicaciones-y-transporte',
      nombre: 'Comunicaciones y Transporte',
      orden: 7,
    },
    {
      slug: 'territorio-vivienda-e-infraestructura',
      nombre: 'Territorio, Vivienda e Infraestructura',
      orden: 8,
    },
    { slug: 'mediacion-y-dialogo', nombre: 'Mediacion y Dialogo', orden: 9 },
    {
      slug: 'manejo-de-animales-y-vegetales',
      nombre: 'Manejo de Animales y Vegetales',
      orden: 10,
    },
  ];

const NOTA_EJEMPLO =
  'Contenido de ejemplo para pruebas de la plataforma. No constituye informacion oficial verificada.';

/** Tramites de ejemplo para probar relaciones y filtros (CLAUDE.md 59). */
export const TRAMITES_SEED: {
  slug: string;
  nombre: string;
  institucionSlug: string;
  categoriaSlugs: string[];
  descripcionCorta: string;
  descripcion: string;
  publicar: boolean;
  requisitos: { titulo: string; descripcion: string }[];
  pasos: { titulo: string; descripcion: string }[];
}[] = [
  {
    slug: 'licencia-de-aprovechamiento-forestal-ejemplo',
    nombre: 'Licencia de aprovechamiento forestal (ejemplo)',
    institucionSlug: 'conap',
    categoriaSlugs: ['medio-ambiente', 'manejo-de-animales-y-vegetales'],
    descripcionCorta:
      'Autorizacion de ejemplo para aprovechar recursos forestales en areas protegidas.',
    descripcion: NOTA_EJEMPLO,
    publicar: true,
    requisitos: [
      {
        titulo: 'Documento Personal de Identificacion (DPI)',
        descripcion: 'Copia del DPI del solicitante.',
      },
      {
        titulo: 'Plan de manejo forestal',
        descripcion: 'Plan tecnico avalado por profesional forestal.',
      },
    ],
    pasos: [
      {
        titulo: 'Presentar solicitud',
        descripcion: 'El ciudadano ingresa la solicitud y adjunta requisitos.',
      },
      {
        titulo: 'Evaluacion tecnica',
        descripcion: 'La institucion revisa el plan de manejo.',
      },
    ],
  },
  {
    slug: 'registro-de-empresa-mercantil-ejemplo',
    nombre: 'Registro de empresa mercantil (ejemplo)',
    institucionSlug: 'ministerio-de-economia',
    categoriaSlugs: ['economia'],
    descripcionCorta:
      'Inscripcion de ejemplo de una empresa mercantil individual.',
    descripcion: NOTA_EJEMPLO,
    publicar: true,
    requisitos: [
      {
        titulo: 'DPI del propietario',
        descripcion: 'Documento de identificacion vigente.',
      },
    ],
    pasos: [
      {
        titulo: 'Llenar formulario',
        descripcion: 'Completar el formulario de inscripcion en linea.',
      },
      {
        titulo: 'Pago de arancel',
        descripcion: 'Realizar el pago correspondiente.',
      },
    ],
  },
  {
    slug: 'constancia-de-capacitacion-en-gestion-de-riesgo-ejemplo',
    nombre: 'Constancia de capacitacion en gestion de riesgo (ejemplo)',
    institucionSlug: 'conred',
    categoriaSlugs: ['seguridad'],
    descripcionCorta:
      'Constancia de ejemplo para personas que completan una capacitacion.',
    descripcion: NOTA_EJEMPLO,
    publicar: false,
    requisitos: [
      {
        titulo: 'Formulario de inscripcion',
        descripcion: 'Formulario completo con datos de contacto.',
      },
    ],
    pasos: [
      {
        titulo: 'Inscribirse a la capacitacion',
        descripcion: 'Seleccionar fecha disponible e inscribirse.',
      },
    ],
  },
];
