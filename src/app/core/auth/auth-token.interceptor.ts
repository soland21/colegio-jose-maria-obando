import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_ORIGIN, LOGIN_ENDPOINT } from './auth.config';
import { AuthService } from './auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url === API_ORIGIN || request.url.startsWith(`${API_ORIGIN}/`);
  if (!isApiRequest || request.url === LOGIN_ENDPOINT) return next(request);

  const token = inject(AuthService).getToken();
  if (!token || request.headers.has('Authorization')) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
