import { environment } from '../../../environments/environment';

const base = environment.apiUrl;

/** Único punto donde se definen las rutas del backend. */
export const API_ROUTES = {
  auth: {
    register: `${base}/auth/register`,
    login: `${base}/auth/login`,
    me: `${base}/auth/me`,
  },
  incidents: {
    root: `${base}/incidents`,
    byId: (id: string): string => `${base}/incidents/${encodeURIComponent(id)}`,
    summary: `${base}/incidents/summary`,
  },
} as const;

/** Endpoints públicos: no llevan token y un 401 no cierra sesión. */
export const PUBLIC_ENDPOINTS: readonly string[] = [API_ROUTES.auth.login, API_ROUTES.auth.register];

/** Tamaño de página solicitado al listar incidencias. */
export const INCIDENTS_PAGE_LIMIT = 100;
