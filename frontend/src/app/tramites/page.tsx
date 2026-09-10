import type { Metadata } from "next";
import {
  listarCategorias,
  listarDepartamentos,
  listarInstituciones,
  listarTramites,
} from "@/lib/api";
import { BarraBusqueda } from "@/components/tramites/BarraBusqueda";
import { PanelFiltros, type ValoresFiltro } from "@/components/tramites/PanelFiltros";
import { Paginacion } from "@/components/tramites/Paginacion";
import { TarjetaTramite } from "@/components/tramites/TarjetaTramite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar tramites",
  description:
    "Busca y filtra los tramites del Estado de Guatemala por institucion, categoria, modalidad, costo y ubicacion.",
};

function primerValor(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function TramitesPage(props: PageProps<"/tramites">) {
  const sp = await props.searchParams;
  const leer = (clave: string) => primerValor(sp[clave]);

  const filtros: ValoresFiltro = {
    institucionId: leer("institucionId"),
    categoriaId: leer("categoriaId"),
    modalidad: leer("modalidad"),
    tipoCosto: leer("tipoCosto"),
    departamentoId: leer("departamentoId"),
    disponibleEnLinea: leer("disponibleEnLinea") === "true",
    orden: leer("orden"),
  };
  const q = leer("q");
  const page = Math.max(1, Number.parseInt(leer("page") || "1", 10) || 1);
  const limit = 12;

  const apiParams = new URLSearchParams();
  if (q) apiParams.set("q", q);
  if (filtros.institucionId) apiParams.set("institucionId", filtros.institucionId);
  if (filtros.categoriaId) apiParams.set("categoriaId", filtros.categoriaId);
  if (filtros.modalidad) apiParams.set("modalidad", filtros.modalidad);
  if (filtros.tipoCosto) apiParams.set("tipoCosto", filtros.tipoCosto);
  if (filtros.departamentoId)
    apiParams.set("departamentoId", filtros.departamentoId);
  if (filtros.disponibleEnLinea) apiParams.set("disponibleEnLinea", "true");
  if (filtros.orden) apiParams.set("orden", filtros.orden);
  apiParams.set("page", String(page));
  apiParams.set("limit", String(limit));

  const [resTramites, resInst, resCat, resDep] = await Promise.allSettled([
    listarTramites(apiParams.toString()),
    listarInstituciones(),
    listarCategorias(),
    listarDepartamentos(),
  ]);

  const instituciones = resInst.status === "fulfilled" ? resInst.value : [];
  const categorias = resCat.status === "fulfilled" ? resCat.value : [];
  const departamentos = resDep.status === "fulfilled" ? resDep.value : [];

  const panel = (
    <PanelFiltros
      valores={filtros}
      instituciones={instituciones}
      categorias={categorias}
      departamentos={departamentos}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Buscar tramites
      </h1>
      <p className="mt-1 text-texto-suave">
        Filtra por institucion, categoria, modalidad, costo y ubicacion.
      </p>

      <div className="mt-5">
        <BarraBusqueda valorInicial={q} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <details className="rounded-xl border border-borde bg-superficie p-3 lg:hidden">
            <summary className="cursor-pointer font-semibold">Filtros</summary>
            <div className="mt-3">{panel}</div>
          </details>
          <div className="hidden lg:block">{panel}</div>
        </aside>

        <section aria-live="polite">
          {resTramites.status === "rejected" ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-semibold">
                No se pudieron cargar los tramites.
              </p>
              <p className="mt-1">
                {resTramites.reason instanceof Error
                  ? resTramites.reason.message
                  : "Error desconocido."}
              </p>
              <p className="mt-2 text-amber-800">
                Cuando el backend y la base de datos esten conectados, los
                resultados apareceran aqui.
              </p>
            </div>
          ) : (
            <ResultadosTramites datos={resTramites.value} consulta={q} />
          )}
        </section>
      </div>
    </div>
  );
}

function ResultadosTramites({
  datos,
  consulta,
}: {
  datos: Awaited<ReturnType<typeof listarTramites>>;
  consulta: string;
}) {
  const { data, meta } = datos;

  return (
    <>
      <p className="mb-4 text-sm text-texto-suave">
        {meta.total === 0
          ? "Sin resultados"
          : `${meta.total} tramite${meta.total === 1 ? "" : "s"} encontrado${
              meta.total === 1 ? "" : "s"
            }`}
        {consulta ? (
          <>
            {" "}
            para <span className="font-medium text-texto">“{consulta}”</span>
          </>
        ) : null}
      </p>

      {data.length === 0 ? (
        <div className="rounded-xl border border-borde bg-superficie p-8 text-center text-texto-suave">
          <p className="font-medium text-texto">
            No encontramos tramites con esos criterios.
          </p>
          <p className="mt-1 text-sm">
            Proba con otras palabras o quita algunos filtros.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((tramite) => (
            <TarjetaTramite key={tramite.id} tramite={tramite} />
          ))}
        </div>
      )}

      <Paginacion meta={meta} />
    </>
  );
}
