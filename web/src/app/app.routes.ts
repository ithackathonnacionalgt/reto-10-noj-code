import type { Routes } from '@angular/router';

/**
 * Rutas de la aplicación.
 *
 * La raíz **es** el catálogo: no hay portada de bienvenida intermedia, los
 * trámites se ven de inmediato. `/tramites` se conserva porque quedaron enlaces
 * publicados apuntando ahí; redirige a la raíz preservando los query params.
 */
export const routes: Routes = [
  {
    path: 'desarrolladores',
    title: 'Desarrolladores · API pública',
    loadComponent: () => import('./features/desarrolladores/desarrolladores').then((m) => m.Desarrolladores),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Catálogo Nacional de Trámites de Guatemala',
    loadComponent: () =>
      import('./features/catalogo/catalogo').then((m) => m.Catalogo),
  },
  {
    path: 'tramites',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'tramites/:slug',
    title: 'Trámite · Catálogo Nacional de Trámites',
    loadComponent: () =>
      import('./features/tramites/tramite-detalle').then((m) => m.TramiteDetalle),
  },
  {
    path: '**',
    title: 'Página no encontrada · Catálogo Nacional de Trámites',
    loadComponent: () =>
      import('./features/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
