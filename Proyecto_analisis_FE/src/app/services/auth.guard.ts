import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (authService.mustChangePassword() && state.url !== '/dashboard/change-password') {
      router.navigate(['/dashboard/change-password']);
      return false;
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
