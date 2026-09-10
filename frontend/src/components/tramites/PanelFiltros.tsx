"use client";

import type { ReactNode } from "react";
import type {
  CategoriaOpcion,
  DepartamentoOpcion,
  InstitucionOpcion,
} from "@/types/api";
import { MODALIDAD, ORDEN, TIPO_COSTO } from "@/lib/etiquetas";
import { useParametros } from "@/lib/navegacion";

export interface ValoresFiltro {
  institucionId: string;
  categoriaId: string;
  modalidad: string;
  tipoCosto: string;
  departamentoId: string;
  disponibleEnLinea: boolean;
  orden: string;
}

interface Props {
  valores: ValoresFiltro;
  instituciones: InstitucionOpcion[];
  categorias: CategoriaOpcion[];
  departamentos: DepartamentoOpcion[];
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

const CLASE_SELECT =
  "w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-sm shadow-sm";

export function PanelFiltros({
  valores,
  instituciones,
  categorias,
  departamentos,
}: Props) {
  const { setParametros, pendiente } = useParametros();

  const hayFiltros =
    valores.institucionId ||
    valores.categoriaId ||
    valores.modalidad ||
    valores.tipoCosto ||
    valores.departamentoId ||
    valores.disponibleEnLinea ||
    (valores.orden && valores.orden !== "recientes");

  return (
    <div
      className="space-y-4 rounded-xl border border-borde bg-superficie p-4"
      aria-busy={pendiente}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filtros</h2>
        {hayFiltros ? (
          <button
            type="button"
            onClick={() =>
              setParametros({
                institucionId: null,
                categoriaId: null,
                modalidad: null,
                tipoCosto: null,
                departamentoId: null,
                disponibleEnLinea: null,
                orden: null,
              })
            }
            className="text-sm font-medium text-primario hover:underline"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <Campo etiqueta="Institucion">
        <select
          className={CLASE_SELECT}
          value={valores.institucionId}
          onChange={(e) =>
            setParametros({ institucionId: e.target.value || null })
          }
        >
          <option value="">Todas</option>
          {instituciones.map((i) => (
            <option key={i.id} value={i.id}>
              {i.siglas ? `${i.siglas} - ${i.nombre}` : i.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Categoria">
        <select
          className={CLASE_SELECT}
          value={valores.categoriaId}
          onChange={(e) =>
            setParametros({ categoriaId: e.target.value || null })
          }
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Modalidad">
        <select
          className={CLASE_SELECT}
          value={valores.modalidad}
          onChange={(e) => setParametros({ modalidad: e.target.value || null })}
        >
          <option value="">Cualquiera</option>
          {Object.entries(MODALIDAD).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Costo">
        <select
          className={CLASE_SELECT}
          value={valores.tipoCosto}
          onChange={(e) => setParametros({ tipoCosto: e.target.value || null })}
        >
          <option value="">Cualquiera</option>
          {Object.entries(TIPO_COSTO).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Departamento">
        <select
          className={CLASE_SELECT}
          value={valores.departamentoId}
          onChange={(e) =>
            setParametros({ departamentoId: e.target.value || null })
          }
        >
          <option value="">Todo el pais</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-borde"
          checked={valores.disponibleEnLinea}
          onChange={(e) =>
            setParametros({
              disponibleEnLinea: e.target.checked ? "true" : null,
            })
          }
        />
        Disponible en linea
      </label>

      <Campo etiqueta="Ordenar por">
        <select
          className={CLASE_SELECT}
          value={valores.orden || "recientes"}
          onChange={(e) => setParametros({ orden: e.target.value || null })}
        >
          {ORDEN.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </Campo>
    </div>
  );
}
