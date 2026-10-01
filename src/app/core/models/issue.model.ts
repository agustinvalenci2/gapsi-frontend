// Valores tal como los maneja el backend.
export const ISSUE_STATUSES = ['pending', 'in progress', 'done', 'rejected'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_PRIORITIES = ['high', 'middle', 'low'] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const STATUS_LABELS: Readonly<Record<IssueStatus, string>> = {
  pending: 'Abierto',
  'in progress': 'En progreso',
  done: 'Completado',
  rejected: 'Rechazado',
};

export const PRIORITY_LABELS: Readonly<Record<IssuePriority, string>> = {
  high: 'Alta',
  middle: 'Media',
  low: 'Baja',
};

/** Modelo de dominio usado por la UI (independiente del formato del API). */
export interface Issue {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: IssuePriority;
  readonly status: IssueStatus;
  readonly createdAt: string | null; // ISO 8601
  readonly updatedAt: string | null; // ISO 8601
}

export interface CreateIssueRequest {
  readonly title: string;
  readonly description: string;
  readonly priority: IssuePriority;
}

export interface UpdateIssueRequest {
  readonly status?: IssueStatus;
  readonly priority?: IssuePriority;
}

export interface IssueFilters {
  readonly status: IssueStatus | null;
  readonly priority: IssuePriority | null;
}

export interface IssueSummary {
  readonly total: number;
  readonly byStatus: Readonly<Record<IssueStatus, number>>;
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return (ISSUE_STATUSES as readonly unknown[]).includes(value);
}

export function isIssuePriority(value: unknown): value is IssuePriority {
  return (ISSUE_PRIORITIES as readonly unknown[]).includes(value);
}
