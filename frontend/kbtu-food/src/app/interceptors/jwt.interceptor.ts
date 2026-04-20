// jwt.interceptor.ts
import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Не добавляем токен к запросам login/register/refresh
  const isAuthUrl = req.url.includes('/auth/login')
                 || req.url.includes('/auth/register')
                 || req.url.includes('/auth/token/refresh');

  const token = auth.getAccessToken();

  // Клонируем запрос и добавляем Authorization header
  const authReq = (token && !isAuthUrl)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // 401 — пробуем обновить access token через refresh
      if (error.status === 401 && !isAuthUrl && auth.getRefreshToken()) {
        return auth.refreshAccessToken().pipe(
          switchMap(({ access }) => {
            // Повторяем оригинальный запрос с новым токеном
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${access}` }
            });
            return next(retryReq);
          }),
          catchError(refreshErr => {
            // Refresh тоже упал — разлогиниваем
            auth.clearTokens();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
