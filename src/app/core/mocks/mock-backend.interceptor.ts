import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpParams,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';

import { API_ROUTES } from '../config/api.config';
import {
  IncidentDto,
  IncidentSummaryDto,
  IncidentWriteDto,
  RegisterRequestDto,
  TokenResponseDto,
  UserDto,
} from '../models/api.model';
import {
  ISSUE_STATUSES,
  IssuePriority,
  IssueStatus,
  isIssuePriority,
  isIssueStatus,
} from '../models/issue.model';

/**
 * Backend simulado que replica el contrato del API real (FastAPI).
 * Se activa con `environment.useMockBackend = true`.
 * Usuario de prueba: admin / admin123
 */

const DB_KEY = 'issue-tracker.mock-db';
const LATENCY_MS = 300;

interface MockUser extends UserDto {
  readonly id: number;
  readonly email: string;
  readonly password: string;
}

interface MockDb {
  users: MockUser[];
  incidents: (IncidentDto & { readonly id: number; readonly owner_id: number })[];
  nextId: number;
}

let db: MockDb = loadDb();

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const handled = route(req);
  if (!handled) return next(req);
  return handled.pipe(materialize(), delay(LATENCY_MS), dematerialize());
};

function route(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> | null {
  const { url, method } = req;
  const R = API_ROUTES;

  if (url === R.auth.register && method === 'POST') return register(req.body as RegisterRequestDto);
  if (url === R.auth.login && method === 'POST') return login(req.body);

  const isProtected = url === R.auth.me || url.startsWith(R.incidents.root);
  if (!isProtected) return null;

  const user = currentUser(req);
  if (!user) return error(401, 'Not authenticated');

  if (url === R.auth.me && method === 'GET') return ok(publicUser(user));
  if (url === R.incidents.summary && method === 'GET') return ok(summary(user.id));
  if (url === R.incidents.root && method === 'GET') return ok(list(user.id, req.params));
  if (url === R.incidents.root && method === 'POST') {
    return create(user.id, req.body as IncidentWriteDto);
  }

  const id = Number(decodeURIComponent(url.slice(R.incidents.root.length + 1)));
  const incident = db.incidents.find((i) => i.id === id && i.owner_id === user.id);
  if (!incident) return error(404, 'Incident not found');

  if (method === 'GET') return ok(incident);
  if (method === 'PUT') return update(id, req.body as IncidentWriteDto);
  if (method === 'DELETE') {
    db.incidents = db.incidents.filter((i) => i.id !== id);
    save();
    return ok(null, 204);
  }
  return error(405, 'Method not allowed');
}

// ---------- handlers ----------

function register(body: RegisterRequestDto): Observable<HttpEvent<UserDto>> {
  if (!body.username || !body.email || !body.password) return error(422, 'Datos inválidos');
  if (db.users.some((u) => u.username === body.username)) {
    return error(400, 'Username already registered');
  }
  const user: MockUser = { id: db.nextId++, ...body };
  db.users.push(user);
  save();
  return ok(publicUser(user), 201);
}

function login(body: unknown): Observable<HttpEvent<TokenResponseDto>> {
  const form = body instanceof HttpParams ? body : new HttpParams();
  const user = db.users.find(
    (u) => u.username === form.get('username') && u.password === form.get('password'),
  );
  if (!user) return error(401, 'Incorrect username or password');
  return ok({ access_token: `mock-token-${user.id}`, token_type: 'bearer' });
}

function list(ownerId: number, params: HttpParams): IncidentDto[] {
  const status = params.get('status');
  const priority = params.get('priority');
  const offset = Number(params.get('offset') ?? 0);
  const limit = Number(params.get('limit') ?? 20);
  return db.incidents
    .filter((i) => i.owner_id === ownerId)
    .filter((i) => !status || i.status === status)
    .filter((i) => !priority || i.priority === priority)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(offset, offset + limit);
}

function summary(ownerId: number): IncidentSummaryDto {
  const own = db.incidents.filter((i) => i.owner_id === ownerId);
  const by_status = Object.fromEntries(ISSUE_STATUSES.map((s) => [s, 0])) as Record<
    IssueStatus,
    number
  >;
  own.forEach((i) => by_status[i.status]++);
  return { total: own.length, by_status };
}

function create(ownerId: number, body: IncidentWriteDto): Observable<HttpEvent<IncidentDto>> {
  if (!isValid(body)) return error(422, 'Datos inválidos');
  const now = new Date().toISOString();
  const incident = {
    id: db.nextId++,
    owner_id: ownerId,
    ...body,
    created_at: now,
    updated_at: now,
  };
  db.incidents.push(incident);
  save();
  return ok(incident, 201);
}

function update(id: number, body: IncidentWriteDto): Observable<HttpEvent<IncidentDto>> {
  if (!isValid(body)) return error(422, 'Datos inválidos');
  let updated: IncidentDto | undefined;
  db.incidents = db.incidents.map((i) =>
    i.id === id ? (updated = { ...i, ...body, updated_at: new Date().toISOString() }) : i,
  ) as MockDb['incidents'];
  save();
  return ok(updated as IncidentDto);
}

// ---------- helpers ----------

function isValid(b: IncidentWriteDto): boolean {
  return !!b?.title?.trim() && isIssuePriority(b.priority) && isIssueStatus(b.status);
}

function currentUser(req: HttpRequest<unknown>): MockUser | undefined {
  const match = /^Bearer mock-token-(\d+)$/.exec(req.headers.get('Authorization') ?? '');
  return match ? db.users.find((u) => u.id === Number(match[1])) : undefined;
}

function publicUser({ id, username, email }: MockUser): UserDto {
  return { id, username, email };
}

function ok<T>(body: T, status = 200): Observable<HttpEvent<T>> {
  return of(new HttpResponse<T>({ status, body }));
}

function error(status: number, detail: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, statusText: detail, error: { detail } }));
}

function save(): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* almacenamiento no disponible */
  }
}

function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockDb>;
      if (Array.isArray(parsed.users) && Array.isArray(parsed.incidents)) return parsed as MockDb;
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return seed();
}

function seed(): MockDb {
  const ago = (d: number): string => new Date(Date.now() - d * 86_400_000).toISOString();
  const rows: [string, string, IssuePriority, IssueStatus, number][] = [
    ['Error al iniciar sesión en Safari', 'El botón de login no responde en Safari 17.', 'high', 'pending', 1],
    ['Mejorar tiempos de carga del dashboard', 'El dashboard tarda más de 4s en cargar.', 'middle', 'in progress', 3],
    ['Typo en el pie de página', 'Dice "Derechos resevados".', 'low', 'done', 6],
    ['Exportación CSV con caracteres rotos', 'Las tildes salen mal al abrir en Excel.', 'middle', 'pending', 2],
    ['Caída del servicio de notificaciones', 'Los correos no se envían desde ayer.', 'high', 'in progress', 0],
    ['Solicitud de modo oscuro', 'Fuera del alcance de esta versión.', 'low', 'rejected', 8],
  ];
  return {
    users: [{ id: 1, username: 'admin', email: 'admin@example.com', password: 'admin123' }],
    incidents: rows.map(([title, description, priority, status, d], idx) => ({
      id: idx + 2,
      owner_id: 1,
      title,
      description,
      priority,
      status,
      created_at: ago(d),
      updated_at: ago(d),
    })),
    nextId: rows.length + 2,
  };
}
