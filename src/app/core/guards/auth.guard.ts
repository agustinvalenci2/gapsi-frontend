import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Solo permite el acceso a usuarios autenticados. */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

/** Evita que un usuario autenticado vuelva a la pantalla de login. */
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).createUrlTree(['/issues']);
};
