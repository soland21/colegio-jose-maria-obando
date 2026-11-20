import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LOGIN_ENDPOINT } from './auth.config';
import { AuthUser, LoginCredentials, LoginResponse, UserRole } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(LOGIN_ENDPOINT, credentials).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('usuarioActual', JSON.stringify(response.usuario));
      }),
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (token && this.tokenIsCurrent(token)) return token;
    if (token) this.clearSession();
    return null;
  }

  getCurrentUser(): AuthUser | null {
    const storedUser = localStorage.getItem('usuarioActual');
    if (!storedUser) return null;

    try {
      const user = JSON.parse(storedUser) as Partial<AuthUser>;
      if (
        typeof user.id === 'number' &&
        typeof user.documento === 'string' &&
        typeof user.nombre === 'string' &&
        (user.rol === 'profesor' || user.rol === 'estudiante')
      ) {
        return user as AuthUser;
      }
    } catch {
      // A corrupt browser session is treated as signed out.
    }

    this.clearSession();
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    if (token && user) return true;
    this.clearSession();
    return false;
  }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUser()?.rol === role;
  }

  homePath(): string {
    return this.getCurrentUser()?.rol === 'profesor'
      ? '/profesor/seleccionar-grado'
      : '/estudiante/inicio';
  }

  logout(): void {
    this.clearSession();
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('gradoSeleccionado');
    localStorage.removeItem('materiaSeleccionada');
  }

  private tokenIsCurrent(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return false;
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { exp?: unknown };
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
