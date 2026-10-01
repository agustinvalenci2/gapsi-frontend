import { Routes } from '@angular/router';

export const ISSUES_ROUTES: Routes = [
  {
    path: '',
    title: 'Incidencias',
    loadComponent: () =>
      import('./pages/issue-list/issue-list.page').then((m) => m.IssueListPage),
  },
  {
    path: 'new',
    title: 'Nueva incidencia',
    loadComponent: () =>
      import('./pages/issue-create/issue-create.page').then((m) => m.IssueCreatePage),
  },
];
