import type { ReactNode } from "react";
import type { TramiteResumen } from "@/types/api";
import { CALIDAD_DATOS, MODALIDAD } from "@/lib/etiquetas";
import { formatearCosto, formatearTiempo } from "@/lib/formato";

function Insignia({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: "neutro" | "primario" | "verde";
}) {
  const clases = {
    neutro: "bg-slate-100 text-slate-700",
    primario: "bg-primario-suave text-primario-oscuro",
    verde: "bg-emerald-50 text-emerald-700",
  }[tono];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${clases}`}
    >
      {children}
    </span>
  );
}

export function TarjetaTramite({ tramite }: { tramite: TramiteResumen }) {
  const institucion =
    tramite.institucion?.siglas ||
    tramite.institucion?.nombre ||
    "Institucion no especificada";

  return (
    <article className="flex h-full flex-col rounded-xl border border-borde bg-superficie p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Insignia tono="primario">{institucion}</Insignia>
        {tramite.disponibleEnLinea && <Insignia tono="verde">En linea</Insignia>}
        {tramite.modalidad && (
          <Insignia>
            {MODALIDAD[tramite.modalidad] ?? tramite.modalidad}
          </Insignia>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug">
        {tramite.nombre}
      </h3>

      {tramite.descripcionCorta ? (
        <p className="mt-1 line-clamp-3 text-sm text-texto-suave">
          {tramite.descripcionCorta}
        </p>
      ) : (
        <p className="mt-1 text-sm italic text-texto-suave">
          Sin descripcion disponible.
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-texto-suave">Costo</dt>
          <dd className="font-medium">{formatearCosto(tramite)}</dd>
        </div>
        <div>
          <dt className="text-texto-suave">Tiempo de respuesta</dt>
          <dd className="font-medium">
            {formatearTiempo(tramite.tiempoRespuesta)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tramite.categorias.slice(0, 3).map((c) => (
          <span
            key={c.id}
            className="rounded border border-borde px-2 py-0.5 text-xs text-texto-suave"
          >
            {c.nombre}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4">
        <EnlaceTramite tramite={tramite} />
      </div>

      <div className="mt-3 flex items-center justify-between pt-3 text-xs text-texto-suave">
        <span>{tramite.codigo ? `Codigo ${tramite.codigo}` : tramite.publicId}</span>
        <span>{CALIDAD_DATOS[tramite.calidadDatos] ?? tramite.calidadDatos}</span>
      </div>
    </article>
  );
}

/** Enlace a donde se realiza el tramite fuera de la plataforma (CLAUDE.md 30). */
function EnlaceTramite({ tramite }: { tramite: TramiteResumen }) {
  if (tramite.urlExterna) {
    return (
      <a
        href={tramite.urlExterna}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primario px-4 py-2 text-sm font-medium text-white hover:bg-primario-oscuro"
      >
        Ir al tramite
        <span aria-hidden>&#8599;</span>
        <span className="sr-only">(se abre en una pestana nueva)</span>
      </a>
    );
  }
  if (tramite.urlFuenteOficial) {
    return (
      <a
        href={tramite.urlFuenteOficial}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primario px-4 py-2 text-sm font-medium text-primario hover:bg-primario-suave"
      >
        Ver en la institucion
        <span aria-hidden>&#8599;</span>
        <span className="sr-only">(se abre en una pestana nueva)</span>
      </a>
    );
  }
  return (
    <p className="text-center text-xs text-texto-suave">
      Este tramite no tiene enlace en linea. Consulta con la institucion
      responsable.
    </p>
  );
}
