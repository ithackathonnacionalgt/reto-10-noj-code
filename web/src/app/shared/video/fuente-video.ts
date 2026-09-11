/**
 * De dónde sale un video y cómo se reproduce.
 *
 * La base guarda una URL cualquiera: un archivo (Supabase Storage, un CDN) se
 * reproduce con `<video>`; YouTube, Vimeo y Google Drive solo se pueden
 * incrustar con su propio reproductor en un `<iframe>`.
 */
export type FuenteVideo =
  | { tipo: 'archivo'; url: string }
  | { tipo: 'incrustado'; proveedor: 'youtube' | 'vimeo' | 'drive'; id: string };

export type FuenteIncrustada = Extract<FuenteVideo, { tipo: 'incrustado' }>;

const ID_YOUTUBE = /^[\w-]{11}$/;
const ID_DRIVE = /^[\w-]{10,}$/;

/** Devuelve el valor solo si tiene la forma de un id válido. */
function validar(valor: string | null | undefined, patron: RegExp): string | null {
  return valor && patron.test(valor) ? valor : null;
}

export function fuenteDeVideo(url: string): FuenteVideo {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { tipo: 'archivo', url };
  }
  const host = u.hostname.replace(/^(www|m)\./, '');

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id =
      (host === 'youtu.be' ? validar(u.pathname.slice(1), ID_YOUTUBE) : null) ??
      validar(u.searchParams.get('v'), ID_YOUTUBE) ??
      validar(u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1], ID_YOUTUBE);
    if (id) return { tipo: 'incrustado', proveedor: 'youtube', id };
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { tipo: 'incrustado', proveedor: 'vimeo', id };
  }

  if (host === 'drive.google.com') {
    const id = validar(
      u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? u.searchParams.get('id'),
      ID_DRIVE,
    );
    if (id) return { tipo: 'incrustado', proveedor: 'drive', id };
  }

  return { tipo: 'archivo', url };
}

export interface OpcionesIncrustado {
  automatico: boolean;
  controles: boolean;
}

/**
 * URL del reproductor incrustado. Siempre en silencio: los navegadores solo
 * permiten reproducir solo un video mudo. El id viene validado, así que la
 * URL es segura para pasarla por `bypassSecurityTrustResourceUrl`.
 */
export function urlIncrustada(f: FuenteIncrustada, o: OpcionesIncrustado): string {
  const bandera = (v: boolean) => (v ? '1' : '0');

  switch (f.proveedor) {
    case 'youtube': {
      const p = new URLSearchParams({
        autoplay: bandera(o.automatico),
        mute: '1',
        loop: '1',
        playlist: f.id, // YouTube solo repite si el video está en una lista
        controls: bandera(o.controles),
        playsinline: '1',
        rel: '0',
        modestbranding: '1',
      });
      return `https://www.youtube-nocookie.com/embed/${f.id}?${p}`;
    }
    case 'vimeo': {
      const p = new URLSearchParams({
        autoplay: bandera(o.automatico),
        muted: '1',
        loop: '1',
        controls: bandera(o.controles),
        playsinline: '1',
        dnt: '1',
        title: '0',
        byline: '0',
        portrait: '0',
      });
      return `https://player.vimeo.com/video/${f.id}?${p}`;
    }
    case 'drive':
      // Drive no acepta parámetros de reproducción: se ve con su visor.
      return `https://drive.google.com/file/d/${f.id}/preview`;
  }
}
