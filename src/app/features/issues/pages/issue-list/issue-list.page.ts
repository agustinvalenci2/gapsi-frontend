import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, finalize, of, switchMap, tap } from 'rxjs';

import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  Issue,
  IssueFilters,
  IssueSummary,
  UpdateIssueRequest,
  isIssuePriority,
  isIssueStatus,
} from '../../../../core/models/issue.model';
import { IssueService } from '../../../../core/services/issue.service';
import { getErrorMessage } from '../../../../shared/http-error';
import { PriorityLabelPipe, StatusLabelPipe } from '../../../../shared/pipes/issue-labels.pipe';
import { IssueFiltersComponent } from '../../components/issue-filters/issue-filters';
import { IssueSummaryComponent } from '../../components/issue-summary/issue-summary';

@Component({
  selector: 'app-issue-list-page',
  imports: [
    RouterLink,
    DatePipe,
    IssueSummaryComponent,
    IssueFiltersComponent,
    StatusLabelPipe,
    PriorityLabelPipe,
  ],
  templateUrl: './issue-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueListPage {
  private readonly issueService = inject(IssueService);

  protected readonly statuses = ISSUE_STATUSES;
  protected readonly priorities = ISSUE_PRIORITIES;

  protected readonly issues = signal<Issue[]>([]);
  protected readonly summary = signal<IssueSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  /** Ids de incidencias con una actualización en curso. */
  protected readonly updating = signal<ReadonlySet<string>>(new Set());

  private readonly filters$ = new BehaviorSubject<IssueFilters>({ status: null, priority: null });

  constructor() {
    this.filters$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap((filters) =>
          this.issueService.getAll(filters).pipe(
            catchError((err: unknown) => {
              this.errorMessage.set(getErrorMessage(err, 'No se pudieron cargar las incidencias'));
              return of<Issue[]>([]);
            }),
            finalize(() => this.loading.set(false)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((issues) => this.issues.set(issues));

    this.loadSummary();
  }

  protected onFiltersChange(filters: IssueFilters): void {
    this.filters$.next(filters);
  }

  protected onStatusChange(issue: Issue, value: string): void {
    if (isIssueStatus(value) && value !== issue.status) this.update(issue, { status: value });
  }

  protected onPriorityChange(issue: Issue, value: string): void {
    if (isIssuePriority(value) && value !== issue.priority) this.update(issue, { priority: value });
  }

  private update(issue: Issue, changes: UpdateIssueRequest): void {
    this.setUpdating(issue.id, true);
    this.issueService
      .update(issue, changes)
      .pipe(finalize(() => this.setUpdating(issue.id, false)))
      .subscribe({
        next: () => {
          // Recarga con los filtros vigentes (la incidencia puede dejar de coincidir).
          this.filters$.next(this.filters$.value);
          this.loadSummary();
        },
        error: (err: unknown) => {
          this.errorMessage.set(getErrorMessage(err, 'No se pudo actualizar la incidencia'));
          // Recarga para restaurar los valores reales en la vista.
          this.filters$.next(this.filters$.value);
        },
      });
  }

  /** Id de la incidencia pendiente de confirmar su eliminación. */
  protected readonly confirmingDelete = signal<string | null>(null);

  protected delete(issue: Issue): void {
    if (this.confirmingDelete() !== issue.id) {
      this.confirmingDelete.set(issue.id);
      return;
    }
    this.confirmingDelete.set(null);
    this.setUpdating(issue.id, true);
    this.issueService
      .delete(issue.id)
      .pipe(finalize(() => this.setUpdating(issue.id, false)))
      .subscribe({
        next: () => {
          this.issues.update((list) => list.filter((i) => i.id !== issue.id));
          this.loadSummary();
        },
        error: (err: unknown) =>
          this.errorMessage.set(getErrorMessage(err, 'No se pudo eliminar la incidencia')),
      });
  }

  private loadSummary(): void {
    this.issueService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summary.set(null),
    });
  }

  private setUpdating(id: string, active: boolean): void {
    this.updating.update((current) => {
      const next = new Set(current);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
