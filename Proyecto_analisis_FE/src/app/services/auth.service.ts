import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoginResponse } from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {
    this.initializeToken();
  }

  private getStoredToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('auth_token');
    }
    return null;
  }

  private initializeToken(): void {
    const token = this.getStoredToken();
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      Username: username,
      Password: password
    }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('auth_token', response.token);
          sessionStorage.setItem('current_user', JSON.stringify(response.usuario));
          sessionStorage.setItem('must_change_password', String(response.requiereCambiarPassword));
          this.tokenSubject.next(response.token);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      }).subscribe({ error: error => console.error('Logout error:', error) });
    }
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('must_change_password');
    sessionStorage.removeItem('permisos_usuario');
    this.tokenSubject.next(null);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): any {
    if (typeof sessionStorage !== 'undefined') {
      const user = sessionStorage.getItem('current_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  mustChangePassword(): boolean {
    return typeof sessionStorage !== 'undefined'
      && sessionStorage.getItem('must_change_password') === 'true';
  }

  clearMustChangePassword(): void {
    sessionStorage.removeItem('must_change_password');
  }
}
