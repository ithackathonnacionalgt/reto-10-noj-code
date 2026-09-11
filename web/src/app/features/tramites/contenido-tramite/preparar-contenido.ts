import type {
  NormativaTramite,
  PasoTramite,
  RequisitoTramite,
  TramiteDetalle,
} from '../../../core/models/catalogo.model';
import { ETIQUETA_CANAL, ETIQUETA_PARTE_RESPONSABLE } from '../../../core/models/enums';

/**
 * Del contenido crudo de la ficha a lo que se muestra.
 *
 * El catálogo se importó de fuentes heterogéneas y trae ruido que no conviene
 * pintar tal cual: pasos partidos a mitad de frase («…Oficina de
 * Acreditación» / «OGA» / «y completarlo.»), títulos de grupo guardados como
 * requisitos («LABORATORIOS DE ENSAYO:») y numeraciones pegadas al texto
 * («2- El servidor…»). Acá se corrige la presentación; el dato no se toca.
 */

export interface PasoVista {
  numero: number;
  titulo: string;
  descripcion: string | null;
  /** Responsable, canal, tiempo, lugar… Solo los que el paso trae. */
  detalles: string[];
  url: string | null;
}

export type ItemRequisito =
  | { clase: 'grupo'; titulo: string }
  | { clase: 'requisito'; titulo: string; descripcion: string | null; marcas: string[] };

export interface NormativaVista {
  titulo: string | null;
  texto: string | null;
  url: string | null;
}

export interface ContenidoFicha {
  descripcion: string | null;
  requisitos: ItemRequisito[];
  totalRequisitos: number;
  pasos: PasoVista[];
  normativas: NormativaVista[];
}

const FIN_DE_FRASE = /[.:;!?)]$/;
/** Un «paso» así de corto tras una frase abierta es el final de esa frase. */
const LARGO_FRAGMENTO = 12;
/** Un requisito que termina en «:» y es así de corto es el título de un grupo. */
const LARGO_GRUPO = 80;

/* Entidades HTML que quedaron sin decodificar al importar las fichas. */
const ENTIDADES: Record<string, string> = {
  '&#160;': ' ',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

/* Las páginas oficiales ocultaban los correos a los robots y el importador
   guardó el reemplazo («[email protected]») en vez de la dirección. */
const CORREO_OCULTO = /\(?\s*\[email\s*protected\]\s*\)?/gi;

/**
 * Entidades decodificadas, correos ocultos reemplazados, espacios repetidos
 * fuera y numeración inicial («2- », «3. ») fuera.
 */
function limpiar(texto: string | null | undefined): string {
  return (texto ?? '')
    .replace(/&(#160|nbsp|amp|quot|#39|lt|gt);/g, (e) => ENTIDADES[e] ?? e)
    .replace(CORREO_OCULTO, ' (el correo que figura en la ficha oficial) ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^\d{1,2}\s*[-.)]\s+/, '')
    .trim();
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* --- Pasos --------------------------------------------------------------- */

/** ¿Este paso es el pedazo final de una frase que quedó partida? */
function esContinuacion(titulo: string, anterior: string, paso: PasoTramite): boolean {
  const soloTexto =
    !paso.descripcion && !paso.urlExterna && !paso.ubicacion && !paso.tiempoEstimado;
  if (!soloTexto) return false;
  return (
    /^[a-záéíóúñü]/.test(titulo) ||
    (titulo.length <= LARGO_FRAGMENTO && !FIN_DE_FRASE.test(anterior))
  );
}

export function prepararPasos(pasos: readonly PasoTramite[]): PasoVista[] {
  const vista: PasoVista[] = [];

  for (const paso of [...pasos].sort((a, b) => a.orden - b.orden)) {
    const titulo = limpiar(paso.titulo);
    if (!titulo) continue;

    const anterior = vista.at(-1);
    if (anterior && esContinuacion(titulo, anterior.titulo, paso)) {
      anterior.titulo = `${anterior.titulo} ${titulo}`;
      continue;
    }

    // «Lo hacés vos» es el caso de casi todos los pasos: repetirlo en cada
    // uno sería ruido. Se marca solo cuando lo hace otro.
    const detalles: string[] = [];
    if (paso.parteResponsable && paso.parteResponsable !== 'ciudadano') {
      detalles.push(ETIQUETA_PARTE_RESPONSABLE[paso.parteResponsable]);
    }
    if (paso.canal) detalles.push(ETIQUETA_CANAL[paso.canal]);
    if (paso.tiempoEstimado) detalles.push(`Tarda ${limpiar(paso.tiempoEstimado)}`);
    if (paso.ubicacion) detalles.push(limpiar(paso.ubicacion));
    if (paso.requierePago) detalles.push('Requiere pago');
    if (paso.requiereDocumento) detalles.push('Llevá tus documentos');

    vista.push({
      numero: vista.length + 1,
      titulo: capitalizar(titulo),
      descripcion: limpiar(paso.descripcion) || null,
      detalles,
      url: paso.urlExterna,
    });
  }

  return vista;
}

/* --- Requisitos ---------------------------------------------------------- */

export function prepararRequisitos(requisitos: readonly RequisitoTramite[]): {
  items: ItemRequisito[];
  total: number;
} {
  const items: ItemRequisito[] = [];
  let total = 0;

  for (const r of [...requisitos].sort((a, b) => a.orden - b.orden)) {
    const titulo = limpiar(r.titulo);
    if (!titulo) continue;

    if (titulo.endsWith(':') && titulo.length <= LARGO_GRUPO && !r.descripcion) {
      items.push({ clase: 'grupo', titulo: titulo.slice(0, -1).trim() });
      continue;
    }

    const marcas: string[] = [];
    if (!r.esObligatorio) marcas.push('Opcional');
    if (r.tipo === 'pago') marcas.push('Pago');
    if (r.tipo === 'condicion') marcas.push('Condición');
    if (r.cantidad && r.cantidad > 1) marcas.push(`${r.cantidad} copias`);

    items.push({
      clase: 'requisito',
      titulo: capitalizar(titulo),
      descripcion: limpiar(r.descripcion) || limpiar(r.notas) || null,
      marcas,
    });
    total++;
  }

  // Un título de grupo sin nada debajo no agrupa nada.
  while (items.at(-1)?.clase === 'grupo') items.pop();
  return { items, total };
}

/* --- Base legal ---------------------------------------------------------- */

export function prepararNormativas(normativas: readonly NormativaTramite[]): NormativaVista[] {
  return normativas
    .map((n) => {
      const titulo = limpiar(n.titulo);
      // «Base legal» es el rótulo de la sección: repetirlo como título no dice nada.
      const partes = [
        titulo && normalizar(titulo) !== 'base legal' ? titulo : '',
        limpiar(n.numero),
        n.fecha?.slice(0, 10) ?? '',
      ].filter(Boolean);
      return {
        titulo: partes.length ? partes.join(' · ') : null,
        texto: limpiar(n.extracto) || null,
        url: n.url,
      };
    })
    .filter((n) => n.titulo || n.texto);
}

/* --- Ficha --------------------------------------------------------------- */

/** La descripción larga, si agrega algo a la corta que ya está en el encabezado. */
function descripcionLarga(t: TramiteDetalle): string | null {
  const larga = (t.descripcion ?? '').trim();
  if (!larga) return null;
  const corta = normalizar(t.descripcionCorta ?? '');
  const n = normalizar(larga);
  if (n === corta || (corta && corta.startsWith(n))) return null;
  return larga;
}

export function prepararContenido(t: TramiteDetalle): ContenidoFicha {
  const { items, total } = prepararRequisitos(t.requisitos ?? []);
  return {
    descripcion: descripcionLarga(t),
    requisitos: items,
    totalRequisitos: total,
    pasos: prepararPasos(t.pasos ?? []),
    normativas: prepararNormativas(t.normativas ?? []),
  };
}
