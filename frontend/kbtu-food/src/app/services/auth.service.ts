import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginPayload    { email: string; password: string; }
interface RegisterPayload { name: string; email: string; password: string; }
interface TokenResponse   { access: string; refresh: string; role?: string; }

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

  private saveTokens(tokens: TokenResponse): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    if (tokens.role) {
      localStorage.setItem('role', tokens.role);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
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