import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'supermarket_owner_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Initialized from localStorage so a page refresh doesn't log you out.
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly isLoggedIn = signal<boolean>(!!this.tokenSignal());

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', request).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        this.tokenSignal.set(response.token);
        this.isLoggedIn.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }
}