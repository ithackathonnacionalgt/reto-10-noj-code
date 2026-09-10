import type {
  CategoriaOpcion,
  DepartamentoOpcion,
  InstitucionOpcion,
  Paginada,
  TramiteResumen,
} from "@/types/api";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function pedir<T>(ruta: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${ruta}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con la API. Verifica que el backend este en marcha.",
      0,
    );
  }

  const cuerpo: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const mensaje =
      (cuerpo as { error?: { message?: string } } | null)?.error?.message ??
      `Error ${res.status}`;
    throw new ApiError(mensaje, res.status);
  }
  return cuerpo as T;
}

export function listarTramites(
  query: string,
): Promise<Paginada<TramiteResumen>> {
  const sep = query ? `?${query}` : "";
  return pedir<Paginada<TramiteResumen>>(`/procedures${sep}`);
}

export async function listarInstituciones(): Promise<InstitucionOpcion[]> {
  const r = await pedir<Paginada<InstitucionOpcion>>(
    "/institutions?limit=100",
  );
  return r.data;
}

export async function listarCategorias(): Promise<CategoriaOpcion[]> {
  const r = await pedir<Paginada<CategoriaOpcion>>("/categories?limit=100");
  return r.data;
}

export async function listarDepartamentos(): Promise<DepartamentoOpcion[]> {
  const r = await pedir<{ data: DepartamentoOpcion[] }>("/departments");
  return r.data;
}
