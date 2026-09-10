const UNIDADES: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Convierte una duracion tipo "15m", "7d", "3600s" a milisegundos.
 * Si recibe solo un numero, se interpreta como segundos.
 */
export function duracionAMs(valor: string): number {
  const limpio = valor.trim();
  const soloNumero = /^\d+$/.test(limpio);
  if (soloNumero) {
    return Number.parseInt(limpio, 10) * 1000;
  }
  const coincidencia = /^(\d+)\s*([smhd])$/i.exec(limpio);
  if (!coincidencia) {
    throw new Error(`Duracion invalida: ${valor}`);
  }
  const cantidad = Number.parseInt(coincidencia[1], 10);
  const unidad = coincidencia[2].toLowerCase();
  return cantidad * UNIDADES[unidad];
}
