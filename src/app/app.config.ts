import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { mockBackendInterceptor } from './core/mocks/mock-backend.interceptor';
import { routes } from './app.routes';

// El mock va al final para que reciba la petición ya con el token adjunto.
const interceptors: HttpInterceptorFn[] = [
  authInterceptor,
  ...(environment.useMockBackend ? [mockBackendInterceptor] : []),
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
  ],
};
