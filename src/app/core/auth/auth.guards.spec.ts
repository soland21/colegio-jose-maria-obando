import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { authGuard, roleGuard } from './auth.guards';
import { provideHttpClient } from '@angular/common/http';

function validToken(): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

describe('auth guards', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('redirige al login cuando no hay una sesión vigente', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/profesor/inicio' } as RouterStateSnapshot),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirige al estudiante si intenta entrar a una ruta de profesor', () => {
    localStorage.setItem('accessToken', validToken());
    localStorage.setItem('usuarioActual', JSON.stringify({
      id: 2, documento: '9876543210', nombre: 'Estudiante', rol: 'estudiante', grado: 'Noveno',
    }));
    const route = { data: { roles: ['profesor'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, { url: '/profesor/inicio' } as RouterStateSnapshot),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/estudiante/inicio');
  });

  it('permite el acceso cuando el rol coincide', () => {
    localStorage.setItem('accessToken', validToken());
    localStorage.setItem('usuarioActual', JSON.stringify({
      id: 1, documento: '1234567890', nombre: 'Docente', rol: 'profesor', grado: null,
    }));
    const route = { data: { roles: ['profesor'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, { url: '/profesor/inicio' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});
