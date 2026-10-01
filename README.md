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

## Docker (puerto 8080)

```bash
docker compose up --build -d     # http://localhost:8080
docker compose logs -f frontend
docker compose down
```

Imagen multi-stage: build de Angular con Node 22 → nginx. El contenedor escucha en `$PORT`
(8080 por defecto, como exige Cloud Run) y nginx reenvía `/api/*` a `BACKEND_URL`.

| Variable | Default | Uso |
|---|---|---|
| `PORT` | `8080` | Puerto de escucha (Cloud Run la inyecta) |
| `BACKEND_URL` | `http://host.docker.internal:8000` | URL base del backend, **sin** `/api` ni `/` final |

Health check: `GET /healthz` → `200 ok`.

El backend se resuelve por DNS en cada petición (`resolver` tomado de `/etc/resolv.conf`), así que
el contenedor **arranca aunque `BACKEND_URL` no esté definido o no resuelva**; en ese caso `/api` responde 502.
Al arrancar se imprime en los logs: `[gapsi] PORT=… BACKEND_URL=… RESOLVER=…`.

## Despliegue en GCP (Cloud Run)

```bash
gcloud config set project <PROJECT_ID>

# Opción A: build + deploy en un paso (usa el Dockerfile)
gcloud run deploy gapsi-frontend \
  --source . \
  --region us-central1 \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars BACKEND_URL=https://<tu-backend>.run.app

# Opción B: imagen en Artifact Registry
gcloud artifacts repositories create gapsi --repository-format=docker --location=us-central1
gcloud builds submit --tag us-central1-docker.pkg.dev/<PROJECT_ID>/gapsi/frontend
gcloud run deploy gapsi-frontend \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/gapsi/frontend \
  --region us-central1 --port 8080 --allow-unauthenticated \
  --set-env-vars BACKEND_URL=https://<tu-backend>.run.app
```

- El navegador solo habla con el frontend; nginx hace de proxy al backend, así que **no hace falta CORS**.
- El proxy envía el `Host` del backend y SNI, requisito para que un backend en Cloud Run responda.
- Si el backend de Cloud Run exige autenticación IAM, el proxy no envía token: despliégalo con
  `--allow-unauthenticated` (la API ya protege sus rutas con JWT).
- Para una VM o GKE: `docker run -p 8080:8080 -e BACKEND_URL=http://<ip-backend>:8000 <imagen>`.

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
