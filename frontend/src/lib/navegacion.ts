"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

type Cambios = Record<string, string | null | undefined>;

/**
 * Actualiza los parametros de la URL manteniendo el resto.
 * Por defecto vuelve a la pagina 1 al cambiar un filtro.
 */
export function useParametros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();

  const setParametros = useCallback(
    (cambios: Cambios, opciones?: { conservarPagina?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === undefined || valor === "") {
          params.delete(clave);
        } else {
          params.set(clave, valor);
        }
      }
      if (!opciones?.conservarPagina) {
        params.delete("page");
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { setParametros, pendiente };
}
