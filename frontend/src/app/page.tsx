import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Encontra el tramite que necesitas
      </h1>
      <p className="mt-3 text-lg text-texto-suave">
        Busca entre los tramites del Estado de Guatemala: requisitos, pasos,
        costos, tiempos de respuesta y donde realizarlos.
      </p>

      <form action="/tramites" method="get" className="mt-8" role="search">
        <label htmlFor="q" className="mb-2 block text-sm font-medium">
          Que tramite buscas?
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Ej. licencia, registro de empresa, constancia..."
            className="w-full rounded-lg border border-borde bg-superficie px-4 py-3 text-base shadow-sm placeholder:text-texto-suave"
          />
          <button
            type="submit"
            className="rounded-lg bg-primario px-6 py-3 font-medium text-white hover:bg-primario-oscuro"
          >
            Buscar
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-texto-suave">
        O bien{" "}
        <Link
          href="/tramites"
          className="font-medium text-primario underline underline-offset-2"
        >
          ver todos los tramites y filtrar
        </Link>
        .
      </p>
    </div>
  );
}
