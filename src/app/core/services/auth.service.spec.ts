import { TestBed } from '@angular/core/testing';
import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_ROUTES } from '../config/api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('login envía form-urlencoded, consulta /me y guarda la sesión', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth.login({ username: 'ana', password: 'secret123' }).subscribe();

    const login = http.expectOne(API_ROUTES.auth.login);
    expect(login.request.body instanceof HttpParams).toBe(true);
    expect((login.request.body as HttpParams).get('username')).toBe('ana');
    login.flush({ access_token: 'jwt', token_type: 'bearer' });

    const me = http.expectOne(API_ROUTES.auth.me);
    expect(me.request.headers.get('Authorization')).toBe('Bearer jwt');
    me.flush({ id: 5, username: 'ana', email: 'ana@x.com' });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()).toEqual({ id: '5', username: 'ana', email: 'ana@x.com' });
    http.verify();
  });
});
