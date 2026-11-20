import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { Login } from './login';

function profesorToken(): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1234567890', exp: Math.floor(Date.now() / 1000) + 3600, role: 'TEACHER' })}.signature`;
}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuarioActual');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('envía las credenciales y redirige al profesor tras autenticar', async () => {
    const accessToken = profesorToken();
    component.formulario.setValue({ documento: '1234567890', password: 'ClaveTemporal123!' });
    component.iniciarSesion();

    const request = http.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      usuario: { id: 1, documento: '1234567890', nombre: 'Docente Prueba', rol: 'profesor', grado: null },
    });
    await fixture.whenStable();

    expect(localStorage.getItem('accessToken')).toBe(accessToken);
    expect(router.url).toBe('/profesor/seleccionar-grado');
  });

  it('muestra un mensaje cuando el backend rechaza las credenciales', () => {
    component.formulario.setValue({ documento: '1234567890', password: 'incorrecta' });
    component.iniciarSesion();

    http.expectOne('http://localhost:8080/api/auth/login').flush(
      { message: 'Documento o contraseña incorrectos.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(component.mensajeError).toBe('Documento o contraseña incorrectos.');
    expect(component.cargando).toBe(false);
  });
});
