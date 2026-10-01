import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  IssueFilters,
  IssuePriority,
  IssueStatus,
} from '../../../../core/models/issue.model';
import { PriorityLabelPipe, StatusLabelPipe } from '../../../../shared/pipes/issue-labels.pipe';

@Component({
  selector: 'app-issue-filters',
  imports: [ReactiveFormsModule, StatusLabelPipe, PriorityLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="filters" [formGroup]="form">
      <label class="field field--inline">
        <span>Estado</span>
        <select formControlName="status">
          <option [ngValue]="null">Todos</option>
          @for (s of statuses; track s) {
            <option [ngValue]="s">{{ s | statusLabel }}</option>
          }
        </select>
      </label>
      <label class="field field--inline">
        <span>Prioridad</span>
        <select formControlName="priority">
          <option [ngValue]="null">Todas</option>
          @for (p of priorities; track p) {
            <option [ngValue]="p">{{ p | priorityLabel }}</option>
          }
        </select>
      </label>
      <button type="button" class="btn btn--ghost" (click)="form.reset()">Limpiar</button>
    </form>
  `,
})
export class IssueFiltersComponent {
  readonly filtersChange = output<IssueFilters>();

  protected readonly statuses = ISSUE_STATUSES;
  protected readonly priorities = ISSUE_PRIORITIES;

  protected readonly form = new FormGroup({
    status: new FormControl<IssueStatus | null>(null),
    priority: new FormControl<IssuePriority | null>(null),
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const { status, priority } = this.form.getRawValue();
      this.filtersChange.emit({ status, priority });
    });
  }
}
