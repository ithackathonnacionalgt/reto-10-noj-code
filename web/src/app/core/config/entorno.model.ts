/** Forma de la configuracion por entorno. */
export interface EntornoApp {
  readonly produccion: boolean;
  /** Base de la API, sin barra final. Ej. `/api/v1` o `http://localhost:3001/api/v1`. */
  readonly apiUrl: string;
}
