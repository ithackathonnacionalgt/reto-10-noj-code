/** Sobre de respuesta para colecciones paginadas (CLAUDE.md 39). */
export interface RespuestaPaginada<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPaginas: number;
  };
}

export function paginar<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): RespuestaPaginada<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
