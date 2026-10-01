import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_ROUTES, INCIDENTS_PAGE_LIMIT } from '../config/api.config';
import {
  IncidentDto,
  IncidentListDto,
  IncidentSummaryDto,
  IncidentWriteDto,
} from '../models/api.model';
import {
  CreateIssueRequest,
  ISSUE_STATUSES,
  Issue,
  IssueFilters,
  IssueStatus,
  IssueSummary,
  UpdateIssueRequest,
} from '../models/issue.model';

@Injectable({ providedIn: 'root' })
export class IssueService {
  private readonly http = inject(HttpClient);

  getAll(filters: IssueFilters): Observable<Issue[]> {
    let params = new HttpParams().set('offset', 0).set('limit', INCIDENTS_PAGE_LIMIT);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);

    return this.http.get<IncidentListDto>(API_ROUTES.incidents.root, { params }).pipe(
      map((dto) => unwrapList(dto).map(toIssue)),
      // Se filtra también en cliente por si el backend ignora los query params.
      map((issues) => issues.filter((i) => matches(i, filters))),
    );
  }

  create(payload: CreateIssueRequest): Observable<Issue> {
    const body: IncidentWriteDto = { ...payload, status: 'pending' };
    return this.http.post<IncidentDto>(API_ROUTES.incidents.root, body).pipe(map(toIssue));
  }

  /** El backend usa PUT, así que se envía el recurso completo con los cambios aplicados. */
  update(issue: Issue, changes: UpdateIssueRequest): Observable<Issue> {
    const body: IncidentWriteDto = {
      title: issue.title,
      description: issue.description,
      priority: changes.priority ?? issue.priority,
      status: changes.status ?? issue.status,
    };
    return this.http.put<IncidentDto>(API_ROUTES.incidents.byId(issue.id), body).pipe(map(toIssue));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.incidents.byId(id));
  }

  getSummary(): Observable<IssueSummary> {
    return this.http.get<IncidentSummaryDto>(API_ROUTES.incidents.summary).pipe(
      map((dto) => {
        const byStatus = Object.fromEntries(
          ISSUE_STATUSES.map((s) => [s, countFor(dto, s)]),
        ) as Record<IssueStatus, number>;
        return { total: dto.total, byStatus };
      }),
    );
  }
}

function countFor(dto: IncidentSummaryDto, status: IssueStatus): number {
  const counts = dto.by_status ?? {};
  if (status === 'in progress') return counts['in progress'] ?? counts.in_progress ?? 0;
  return counts[status] ?? 0;
}

function unwrapList(dto: IncidentListDto): readonly IncidentDto[] {
  if (Array.isArray(dto)) return dto;
  const page = dto as Exclude<IncidentListDto, readonly IncidentDto[]>;
  return page.items ?? page.data ?? page.results ?? [];
}

function toIssue(dto: IncidentDto): Issue {
  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description ?? '',
    priority: dto.priority,
    status: dto.status,
    createdAt: dto.created_at ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

function matches(issue: Issue, { status, priority }: IssueFilters): boolean {
  return (!status || issue.status === status) && (!priority || issue.priority === priority);
}
