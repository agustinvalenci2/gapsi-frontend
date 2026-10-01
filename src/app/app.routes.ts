import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    title: 'Iniciar sesión',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canMatch: [guestGuard],
    title: 'Crear cuenta',
    loadComponent: () =>
      import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'issues',
        loadChildren: () => import('./features/issues/issues.routes').then((m) => m.ISSUES_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'issues' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
