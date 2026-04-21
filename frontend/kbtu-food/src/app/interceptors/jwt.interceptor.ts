import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

const isAuthUrl = req.url.includes('/auth/login')
               || req.url.includes('/auth/register')
               || req.url.includes('/auth/token');

  const token = auth.getAccessToken();

  const authReq = (token && !isAuthUrl)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthUrl) {
        auth.clearTokens();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};