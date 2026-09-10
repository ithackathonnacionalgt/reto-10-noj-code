"use client";

import type { Meta } from "@/types/api";
import { useParametros } from "@/lib/navegacion";

export function Paginacion({ meta }: { meta: Meta }) {
  const { setParametros, pendiente } = useParametros();

  if (meta.totalPaginas <= 1) return null;

  const ir = (pagina: number) =>
    setParametros({ page: String(pagina) }, { conservarPagina: true });

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-3"
      aria-label="Paginacion"
    >
      <button
        type="button"
        disabled={meta.page <= 1 || pendiente}
        onClick={() => ir(meta.page - 1)}
        className="rounded-lg border border-borde bg-superficie px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="text-sm text-texto-suave">
        Pagina {meta.page} de {meta.totalPaginas}
      </span>
      <button
        type="button"
        disabled={meta.page >= meta.totalPaginas || pendiente}
        onClick={() => ir(meta.page + 1)}
        className="rounded-lg border border-borde bg-superficie px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Siguiente
      </button>
    </nav>
  );
}
