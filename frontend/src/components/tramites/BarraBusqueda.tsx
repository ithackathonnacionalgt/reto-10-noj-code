"use client";

import { useParametros } from "@/lib/navegacion";

export function BarraBusqueda({ valorInicial }: { valorInicial: string }) {
  const { setParametros, pendiente } = useParametros();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const dato = new FormData(e.currentTarget).get("q");
        const texto = typeof dato === "string" ? dato.trim() : "";
        setParametros({ q: texto || null });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="busqueda" className="sr-only">
        Buscar tramites
      </label>
      <input
        // se re-monta cuando cambia el parametro q en la URL (back, enlaces)
        key={valorInicial}
        id="busqueda"
        name="q"
        type="search"
        defaultValue={valorInicial}
        placeholder="Buscar por nombre, institucion o codigo..."
        className="w-full rounded-lg border border-borde bg-superficie px-4 py-2.5 text-base shadow-sm placeholder:text-texto-suave"
      />
      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg bg-primario px-6 py-2.5 font-medium text-white hover:bg-primario-oscuro disabled:opacity-60"
      >
        {pendiente ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
