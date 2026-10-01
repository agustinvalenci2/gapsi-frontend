import { IssuePriority, IssueStatus } from './issue.model';

/** DTOs con el formato exacto del backend (snake_case). */

export interface TokenResponseDto {
  readonly access_token: string;
  readonly token_type: string;
}

export interface UserDto {
  readonly id: string | number;
  readonly username: string;
  readonly email?: string;
}

export interface RegisterRequestDto {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export interface IncidentDto {
  readonly id: string | number;
  readonly title: string;
  readonly description: string | null;
  readonly priority: IssuePriority;
  readonly status: IssueStatus;
  readonly user_id?: number;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
}

export interface IncidentWriteDto {
  readonly title: string;
  readonly description: string;
  readonly priority: IssuePriority;
  readonly status: IssueStatus;
}

/** El listado puede venir como arreglo o envuelto en un objeto paginado. */
export type IncidentListDto =
  | readonly IncidentDto[]
  | {
      readonly items?: readonly IncidentDto[];
      readonly data?: readonly IncidentDto[];
      readonly results?: readonly IncidentDto[];
      readonly total?: number;
    };

export interface IncidentSummaryDto {
  readonly total: number;
  // El backend puede devolver la clave "in progress" o "in_progress".
  readonly by_status: Partial<Record<IssueStatus | 'in_progress', number>>;
}
