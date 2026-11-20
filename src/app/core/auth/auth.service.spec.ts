import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOGIN_ENDPOINT } from './auth.config';
import { AuthService } from './auth.service';

function tokenFor(role: string, expiresAt = Math.floor(Date.now() / 1000) + 3600): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: expiresAt })}.signature`;
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('guarda el JWT y el usuario devueltos por el backend', () => {
    const accessToken = tokenFor('TEACHER');
    auth.login({ documento: '1234567890', password: 'secreto' }).subscribe();

    const request = http.expectOne(LOGIN_ENDPOINT);
    expect(request.request.body).toEqual({ documento: '1234567890', password: 'secreto' });
    request.flush({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: { id: 1, documento: '1234567890', nombre: 'Docente', rol: 'profesor', grado: null },
    });

    expect(auth.getToken()).toBe(accessToken);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.hasRole('profesor')).toBe(true);
  });

  it('borra una sesión con JWT vencido o inválido', () => {
    localStorage.setItem('accessToken', tokenFor('STUDENT', Math.floor(Date.now() / 1000) - 1));
    localStorage.setItem('usuarioActual', JSON.stringify({
      id: 2, documento: '9876543210', nombre: 'Estudiante', rol: 'estudiante', grado: 'Noveno',
    }));

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('usuarioActual')).toBeNull();
  });

  it('el cierre de sesión limpia el usuario y los datos de contexto', () => {
    localStorage.setItem('accessToken', tokenFor('TEACHER'));
    localStorage.setItem('usuarioActual', JSON.stringify({ id: 1, documento: '123', nombre: 'Docente', rol: 'profesor' }));
    localStorage.setItem('gradoSeleccionado', '{"numero":9}');
    localStorage.setItem('materiaSeleccionada', 'Matemáticas');

    auth.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('usuarioActual')).toBeNull();
    expect(localStorage.getItem('gradoSeleccionado')).toBeNull();
    expect(localStorage.getItem('materiaSeleccionada')).toBeNull();
  });
});
