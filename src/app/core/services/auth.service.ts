import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';

import { API_ROUTES } from '../config/api.config';
import { TokenResponseDto, UserDto } from '../models/api.model';
import { LoginRequest, RegisterRequest, User } from '../models/auth.model';

const SESSION_KEY = 'issue-tracker.session';

interface StoredSession {
  readonly token: string;
  readonly user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<StoredSession | null>(readSession());

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly token = computed<string | null>(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed<boolean>(() => this.session() !== null);

  /** OAuth2 password flow: el backend espera application/x-www-form-urlencoded. */
  login({ username, password }: LoginRequest): Observable<User> {
    const body = new HttpParams().set('username', username).set('password', password);
    return this.http.post<TokenResponseDto>(API_ROUTES.auth.login, body).pipe(
      switchMap(({ access_token }) =>
        this.fetchMe(access_token).pipe(
          tap((user) => this.setSession({ token: access_token, user })),
        ),
      ),
    );
  }

  /** Registra al usuario y luego inicia sesión con las mismas credenciales. */
  register(data: RegisterRequest): Observable<User> {
    return this.http
      .post<UserDto>(API_ROUTES.auth.register, data)
      .pipe(switchMap(() => this.login({ username: data.username, password: data.password })));
  }

  /** El backend usa JWT sin estado: cerrar sesión es descartar el token. */
  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private fetchMe(token: string): Observable<User> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<UserDto>(API_ROUTES.auth.me, { headers }).pipe(
      map((dto) => ({ id: String(dto.id), username: dto.username, email: dto.email ?? null })),
    );
  }

  private setSession(session: StoredSession): void {
    this.session.set(session);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* almacenamiento no disponible */
    }
  }
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<StoredSession>;
  return (
    typeof v.token === 'string' &&
    typeof v.user === 'object' &&
    v.user !== null &&
    typeof v.user.username === 'string'
  );
}
