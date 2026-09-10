import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsGt from '@angular/common/locales/es-GT';
import {
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  type ApplicationConfig,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { errorApiInterceptor } from './core/api/error-api.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeEsGt, 'es-GT');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Guatemala: formatos de fecha y numero locales.
    { provide: LOCALE_ID, useValue: 'es-GT' },

    provideRouter(
      routes,
      // `:slug` llega al componente como signal input, sin leer ActivatedRoute.
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),

    provideHttpClient(
      // `fetch` en vez de XHR: menos peso y mejor comportamiento en edge runtimes.
      withFetch(),
      withInterceptors([errorApiInterceptor]),
    ),
  ],
};
