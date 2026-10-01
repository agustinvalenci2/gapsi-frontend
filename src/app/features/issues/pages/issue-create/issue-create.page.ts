import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ISSUE_PRIORITIES, IssuePriority } from '../../../../core/models/issue.model';
import { IssueService } from '../../../../core/services/issue.service';
import { getErrorMessage } from '../../../../shared/http-error';
import { PriorityLabelPipe } from '../../../../shared/pipes/issue-labels.pipe';

@Component({
  selector: 'app-issue-create-page',
  imports: [ReactiveFormsModule, RouterLink, PriorityLabelPipe],
  templateUrl: './issue-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueCreatePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly issueService = inject(IssueService);
  private readonly router = inject(Router);

  protected readonly priorities = ISSUE_PRIORITIES;
  protected readonly titleMax = 100;
  protected readonly descriptionMax = 1000;

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(this.titleMax)]],
    description: ['', [Validators.required, Validators.maxLength(this.descriptionMax)]],
    priority: this.fb.control<IssuePriority>('middle', Validators.required),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const { title, description, priority } = this.form.getRawValue();
    this.issueService
      .create({ title: title.trim(), description: description.trim(), priority })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/issues']),
        error: (err: unknown) =>
          this.errorMessage.set(getErrorMessage(err, 'No se pudo crear la incidencia')),
      });
  }
}
