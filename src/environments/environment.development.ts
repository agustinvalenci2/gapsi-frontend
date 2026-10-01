import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  // `ng serve` redirige /api → http://localhost:8000 (ver proxy.conf.json), sin problemas de CORS.
  apiUrl: '/api/v1',
  // true = backend simulado en el navegador (útil sin servidor).
  useMockBackend: false,
};
