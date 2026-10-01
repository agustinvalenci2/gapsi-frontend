import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_ROUTES } from '../config/api.config';
import { Issue } from '../models/issue.model';
import { IssueService } from './issue.service';

describe('IssueService (contrato del API)', () => {
  let service: IssueService;
  let http: HttpTestingController;

  const issue: Issue = {
    id: '7',
    title: 'Error',
    description: 'Desc',
    priority: 'high',
    status: 'pending',
    createdAt: null,
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(IssueService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con offset/limit y filtros, y mapea snake_case', () => {
    let result: Issue[] = [];
    service.getAll({ status: 'in progress', priority: null }).subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === API_ROUTES.incidents.root);
    expect(req.request.params.get('offset')).toBe('0');
    expect(req.request.params.get('status')).toBe('in progress');
    expect(req.request.params.has('priority')).toBe(false);
    req.flush([
      { id: 1, title: 'A', description: null, priority: 'low', status: 'in progress', created_at: '2026-01-01T00:00:00Z' },
      { id: 2, title: 'B', description: 'x', priority: 'low', status: 'done' },
    ]);

    expect(result.length).toBe(1); // filtrado en cliente como respaldo
    expect(result[0].id).toBe('1');
    expect(result[0].description).toBe('');
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('acepta respuesta paginada { items }', () => {
    let count = -1;
    service.getAll({ status: null, priority: null }).subscribe((r) => (count = r.length));
    http.expectOne((r) => r.url === API_ROUTES.incidents.root).flush({ items: [{ id: 1, title: 'A', description: '', priority: 'low', status: 'done' }], total: 1 });
    expect(count).toBe(1);
  });

  it('crea con status pending', () => {
    service.create({ title: 'T', description: 'D', priority: 'middle' }).subscribe();
    const req = http.expectOne(API_ROUTES.incidents.root);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'T', description: 'D', priority: 'middle', status: 'pending' });
    req.flush({ id: 9, title: 'T', description: 'D', priority: 'middle', status: 'pending' });
  });

  it('actualiza con PUT enviando el recurso completo', () => {
    service.update(issue, { status: 'done' }).subscribe();
    const req = http.expectOne(API_ROUTES.incidents.byId('7'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Error', description: 'Desc', priority: 'high', status: 'done' });
    req.flush({ ...issue, id: 7, status: 'done' });
  });

  it('resumen acepta la clave in_progress', () => {
    let inProgress = -1;
    service.getSummary().subscribe((s) => (inProgress = s.byStatus['in progress']));
    http.expectOne(API_ROUTES.incidents.summary).flush({ total: 4, by_status: { pending: 1, in_progress: 3 } });
    expect(inProgress).toBe(3);
  });

  it('resumen completa estados faltantes con 0', () => {
    let byStatus: Record<string, number> = {};
    service.getSummary().subscribe((s) => (byStatus = { ...s.byStatus }));
    http.expectOne(API_ROUTES.incidents.summary).flush({ total: 3, by_status: { pending: 2, done: 1 } });
    expect(byStatus).toEqual({ pending: 2, 'in progress': 0, done: 1, rejected: 0 });
  });
});
