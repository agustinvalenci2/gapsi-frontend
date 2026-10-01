import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/issues">Issue Tracker</a>
      <nav class="topbar__nav">
        <a routerLink="/issues" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Incidencias
        </a>
        <a routerLink="/issues/new" routerLinkActive="active">Nueva incidencia</a>
      </nav>
      <div class="topbar__user">
        <span class="muted">{{ auth.user()?.username }}</span>
        <button type="button" class="btn btn--ghost" (click)="auth.logout()">Cerrar sesión</button>
      </div>
    </header>
    <main class="container">
      <router-outlet />
    </main>
  `,
})
export class MainLayout {
  protected readonly auth = inject(AuthService);
}
