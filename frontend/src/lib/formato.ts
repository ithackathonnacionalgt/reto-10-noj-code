import type { TiempoRespuesta, TramiteResumen } from "@/types/api";
import { UNIDAD_TIEMPO } from "./etiquetas";

/** Costo legible, tolerando informacion incompleta (CLAUDE.md 46). */
export function formatearCosto(tramite: TramiteResumen): string {
  if (tramite.tipoCosto === "gratuito") return "Gratuito";
  if (tramite.tipoCosto === "fijo" && tramite.costo != null) {
    return `${tramite.moneda} ${tramite.costo.toFixed(2)}`;
  }
  if (tramite.tipoCosto === "variable") return "Costo variable";
  return "Costo no disponible";
}

/** Tiempo de respuesta legible, tolerando informacion incompleta. */
export function formatearTiempo(tiempo: TiempoRespuesta): string {
  if (tiempo.valor != null && tiempo.unidad) {
    return `${tiempo.valor} ${UNIDAD_TIEMPO[tiempo.unidad] ?? tiempo.unidad}`;
  }
  if (tiempo.texto) return tiempo.texto;
  return "Tiempo no disponible";
}
