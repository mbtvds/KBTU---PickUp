import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginPayload    { email: string; password: string; }
interface RegisterPayload { name: string; email: string; password: string; }
interface TokenResponse   { access: string; refresh: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.api}/auth/login/`, payload).pipe(
      tap((tokens: TokenResponse) => this.saveTokens(tokens))
    );
  }

  register(payload: RegisterPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.api}/auth/register/`, payload).pipe(
      tap((tokens: TokenResponse) => this.saveTokens(tokens))
    );
  }

  logout(): Observable<void> {
    const refresh = this.getRefreshToken();
    this.clearTokens();
    return this.http.post<void>(`${this.api}/auth/logout/`, { refresh });
  }

  private saveTokens(tokens: TokenResponse): void {
    localStorage.setItem('access_token',  tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  refreshAccessToken(): Observable<{ access: string }> {
    return this.http.post<{ access: string }>(`${this.api}/auth/token/refresh/`, {
      refresh: this.getRefreshToken()
    }).pipe(
      tap((res: { access: string }) => localStorage.setItem('access_token', res.access))
    );
  }
}
