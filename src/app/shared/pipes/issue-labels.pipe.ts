import { Pipe, PipeTransform } from '@angular/core';

import {
  IssuePriority,
  IssueStatus,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../core/models/issue.model';

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: IssueStatus): string {
    return STATUS_LABELS[value];
  }
}

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: IssuePriority): string {
    return PRIORITY_LABELS[value];
  }
}
