import type {
  Tramite,
  TramiteCategoria,
} from '../../database/entities/schema.js';

function categoriasDe(relaciones?: TramiteCategoria[]) {
  return (relaciones ?? [])
    .filter((tc) => tc.categoria)
    .map((tc) => ({
      id: tc.categoria.id,
      slug: tc.categoria.slug,
      nombre: tc.categoria.nombre,
      esPrincipal: tc.esPrincipal,
    }));
}

function institucionDe(tramite: Tramite) {
  if (!tramite.institucion) {
    return { id: tramite.institucionId };
  }
  return {
    id: tramite.institucion.id,
    slug: tramite.institucion.slug,
    nombre: tramite.institucion.nombre,
    siglas: tramite.institucion.siglas,
    urlLogo: tramite.institucion.urlLogo,
  };
}

/** Item de listado (CLAUDE.md 40). */
export function aResumen(tramite: Tramite) {
  return {
    id: tramite.id,
    publicId: tramite.publicId,
    slug: tramite.slug,
    codigo: tramite.codigo,
    nombre: tramite.nombre,
    descripcionCorta: tramite.descripcionCorta,
    estado: tramite.estado,
    modoEjecucion: tramite.modoEjecucion,
    modalidad: tramite.modalidad,
    disponibleEnLinea: tramite.disponibleEnLinea,
    tipoCosto: tramite.tipoCosto,
    costo: tramite.costo,
    moneda: tramite.moneda,
    tiempoRespuesta: {
      valor: tramite.tiempoRespuestaValor,
      unidad: tramite.tiempoRespuestaUnidad,
      texto: tramite.tiempoRespuestaTexto,
    },
    calidadDatos: tramite.calidadDatos,
    /** URL de la pagina externa donde se realiza el tramite (CLAUDE.md 12). */
    urlExterna: tramite.urlExterna,
    /** URL oficial de la institucion que describe el tramite. */
    urlFuenteOficial: tramite.urlFuenteOficial,
    institucion: institucionDe(tramite),
    categorias: categoriasDe(tramite.categorias),
    publicadoEn: tramite.publicadoEn,
    actualizadoEn: tramite.fechaActualizacion,
  };
}

/** Ficha completa del tramite (CLAUDE.md 12, 30). */
export function aDetalle(tramite: Tramite) {
  const ordenar = <T extends { orden: number }>(items?: T[]) =>
    [...(items ?? [])].sort((a, b) => a.orden - b.orden);

  return {
    ...aResumen(tramite),
    descripcion: tramite.descripcion,
    resultado: tramite.resultado,
    dirigidoA: tramite.dirigidoA,
    vigencia: {
      fechaInicio: tramite.fechaInicio,
      fechaVencimiento: tramite.fechaVencimiento,
      periodoValidez: tramite.periodoValidez,
    },
    fuente: {
      tipoFuente: tramite.tipoFuente,
      sourceUrl: tramite.sourceUrl,
      ultimaVerificacionEn: tramite.ultimaVerificacionEn,
    },
    vistas: tramite.vistas,
    requisitos: ordenar(tramite.requisitos).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      tipo: r.tipo,
      esObligatorio: r.esObligatorio,
      cantidad: r.cantidad,
      requiereArchivo: r.requiereArchivo,
      tiposArchivoPermitidos: r.tiposArchivoPermitidos,
      diasValidez: r.diasValidez,
      notas: r.notas,
      orden: r.orden,
    })),
    pasos: ordenar(tramite.pasos).map((p) => ({
      id: p.id,
      orden: p.orden,
      titulo: p.titulo,
      descripcion: p.descripcion,
      parteResponsable: p.parteResponsable,
      tiempoEstimado: p.tiempoEstimado,
      canal: p.canal,
      ubicacion: p.ubicacion,
      requierePago: p.requierePago,
      requiereDocumento: p.requiereDocumento,
      urlExterna: p.urlExterna,
    })),
    normativas: ordenar(tramite.normativas).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      tipo: n.tipo,
      numero: n.numero,
      url: n.url,
      fecha: n.fecha,
      extracto: n.extracto,
    })),
    enlaces: ordenar(tramite.enlaces).map((e) => ({
      id: e.id,
      tipo: e.tipo,
      titulo: e.titulo,
      url: e.url,
    })),
    costos: ordenar(tramite.costos).map((c) => ({
      id: c.id,
      concepto: c.concepto,
      tipoCosto: c.tipoCosto,
      monto: c.monto,
      moneda: c.moneda,
      descripcion: c.descripcion,
    })),
    tiempos: (tramite.tiempos ?? []).map((t) => ({
      id: t.id,
      concepto: t.concepto,
      valor: t.valor,
      unidad: t.unidad,
      descripcion: t.descripcion,
    })),
    creadoEn: tramite.fechaCreacion,
  };
}
