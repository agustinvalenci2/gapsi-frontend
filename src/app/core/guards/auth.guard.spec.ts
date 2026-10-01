import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Route, Router, UrlSegment, UrlTree, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  const run = (guard: typeof authGuard): boolean | UrlTree =>
    TestBed.runInInjectionContext(() => guard({} as Route, [] as UrlSegment[])) as boolean | UrlTree;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('authGuard redirige a /login sin sesión', () => {
    const result = run(authGuard);
    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('guestGuard permite el acceso sin sesión', () => {
    expect(run(guestGuard)).toBe(true);
  });

  it('authGuard permite el acceso con sesión', () => {
    localStorage.setItem(
      'issue-tracker.session',
      JSON.stringify({ token: 't', user: { id: '1', username: 'a', email: null } }),
    );
    TestBed.inject(AuthService);
    expect(run(authGuard)).toBe(true);
  });
});
