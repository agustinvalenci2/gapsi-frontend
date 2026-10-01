import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ISSUE_STATUSES, IssueSummary } from '../../../../core/models/issue.model';
import { StatusLabelPipe } from '../../../../shared/pipes/issue-labels.pipe';

@Component({
  selector: 'app-issue-summary',
  imports: [StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="summary" aria-label="Resumen de incidencias">
      <article class="summary__card">
        <span class="summary__label">Total</span>
        <strong class="summary__value">{{ summary()?.total ?? '–' }}</strong>
      </article>
      @for (status of statuses; track status) {
        <article class="summary__card" [attr.data-status]="status">
          <span class="summary__label">{{ status | statusLabel }}</span>
          <strong class="summary__value">{{ summary()?.byStatus?.[status] ?? '–' }}</strong>
        </article>
      }
    </section>
  `,
})
export class IssueSummaryComponent {
  readonly summary = input<IssueSummary | null>(null);
  protected readonly statuses = ISSUE_STATUSES;
}
