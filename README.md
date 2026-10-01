# Issue Tracker — Frontend (Angular 21)

Gestión de incidencias: registro, login/logout, listado, creación, cambio de estado y prioridad, filtros y resumen por estado.

## Requisitos cubiertos

| Requisito | Dónde |
|---|---|
| Standalone Components | Todos los componentes (sin NgModules) |
| Routing | `app.routes.ts`, `features/issues/issues.routes.ts` |
| Lazy loading | `loadComponent` / `loadChildren` en todas las rutas |
| Reactive Forms | Login, creación de incidencia, filtros (formularios tipados) |
| HttpClient | `core/services/*.service.ts` + interceptores funcionales |
| Strict typing | `strict` + `strictTemplates`, modelos/uniones literales en `core/models` |

## Ejecutar

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build
```

`npm start` usa `proxy.conf.json`: las peticiones a `/api` se redirigen a `http://localhost:8000`,
así que no hace falta configurar CORS en desarrollo. Levanta primero el backend en el puerto 8000.

### Sin backend

En `src/environments/environment.development.ts` pon `useMockBackend: true`. Se usa un backend
simulado en el navegador con el mismo contrato. Usuario: **admin / admin123** (o regístrate).

## Docker

```bash
docker compose up --build -d     # http://localhost:4200
docker compose logs -f frontend
docker compose down
```

Imagen multi-stage: build de Angular con Node 22, servido con nginx. nginx reenvía `/api/*`
a `BACKEND_URL` (por defecto `http://host.docker.internal:8000`, es decir, el backend corriendo en tu máquina).
Si el backend corre en otro contenedor de la misma red de compose:

```bash
BACKEND_URL=http://backend:8000 docker compose up --build -d
```

## Contrato de API (colección Postman GAPSI)

Base: `/api/v1`. Todas las rutas, excepto registro y login, envían `Authorization: Bearer <token>`.
Un `401` cierra la sesión. Los errores se leen de `detail` (formato FastAPI).

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ username, email, password }` | `201` usuario |
| POST | `/auth/login` | form-urlencoded `username`, `password` | `{ access_token, token_type }` |
| GET | `/auth/me` | — | `{ id, username, email }` |
| GET | `/incidents?offset=0&limit=100` | — | `Incident[]` |
| POST | `/incidents` | `{ title, description, priority, status: "pending" }` | `201 Incident` |
| PUT | `/incidents/{id}` | `{ title, description, priority, status }` | `Incident` |
| DELETE | `/incidents/{id}` | — | `204` |
| GET | `/incidents/summary` | — | `{ total, by_status: { pending, "in progress", done, rejected } }` |

- **Estados:** `pending` (Abierto), `in progress` (En progreso), `done` (Completado), `rejected` (Rechazado).
- **Prioridades:** `high`, `middle`, `low`.
- El API no tiene filtros: el front envía `status` / `priority` como query params (se ignoran) y filtra en cliente.
- Logout: el JWT no tiene estado, se descarta el token localmente.
- Las rutas se ajustan solo en `src/app/core/config/api.config.ts`. Los DTOs están en `core/models/api.model.ts`.

## Estructura

```
src/app/
  core/
    config/api.config.ts        rutas del backend (único punto a editar)
    models/                     tipos de dominio
    services/                   AuthService, IssueService
    interceptors/               token + manejo de 401
    guards/                     authGuard / guestGuard (CanMatch)
    mocks/                      backend simulado (interceptor)
    models/api.model.ts         DTOs del backend (snake_case) → mapeados en IssueService
  layout/main-layout.ts         barra superior + logout
  features/
    auth/login, auth/register   login y registro (lazy)
    issues/                     rutas lazy: listado + creación
      components/               resumen y filtros
  shared/                       pipes de etiquetas, helper de errores
```
