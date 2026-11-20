import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ORIGIN, LOGIN_ENDPOINT } from './auth.config';
import { authTokenInterceptor } from './auth-token.interceptor';

function validToken(): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

describe('authTokenInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authTokenInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('agrega Authorization Bearer solo a solicitudes de la API protegida', () => {
    const token = validToken();
    localStorage.setItem('accessToken', token);

    client.get(`${API_ORIGIN}/api/tareas`).subscribe();
    const apiRequest = http.expectOne(`${API_ORIGIN}/api/tareas`);
    expect(apiRequest.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    apiRequest.flush({});

    client.get('https://example.com/data').subscribe();
    const externalRequest = http.expectOne('https://example.com/data');
    expect(externalRequest.request.headers.has('Authorization')).toBe(false);
    externalRequest.flush({});
  });

  it('no agrega el token a la solicitud pública de login', () => {
    localStorage.setItem('accessToken', validToken());

    client.post(LOGIN_ENDPOINT, {}).subscribe();
    const request = http.expectOne(LOGIN_ENDPOINT);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
