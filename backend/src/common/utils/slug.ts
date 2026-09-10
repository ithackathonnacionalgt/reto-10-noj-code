/** Convierte un texto en un slug apto para URLs (CLAUDE.md 33). */
export function generarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120);
}

/** Sufijo corto aleatorio para desambiguar slugs repetidos. */
export function sufijoAleatorio(longitud = 6): string {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let salida = '';
  for (let i = 0; i < longitud; i += 1) {
    salida += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return salida;
}

/**
 * Devuelve un slug unico probando sufijos aleatorios hasta que `existe`
 * responda false.
 */
export async function asegurarSlugUnico(
  base: string,
  existe: (slug: string) => Promise<boolean>,
): Promise<string> {
  const raiz = base || sufijoAleatorio();
  let candidato = raiz;
  let intentos = 0;
  while (await existe(candidato)) {
    intentos += 1;
    candidato = `${raiz}-${sufijoAleatorio(4)}`;
    if (intentos > 10) {
      candidato = `${raiz}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidato;
}
