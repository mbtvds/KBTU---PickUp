import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {

  mode: Mode = 'login';

  name     = '';
  email    = '';
  password = '';
  confirm  = '';

  isLoading    = false;
  errorMessage = '';
  isSuccess    = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,

  ) {}

  switchMode(m: Mode): void {
    this.mode = m;
    this.errorMessage = '';
    this.name = this.confirm = '';
  }

login(): void {
  if (!this.validate()) return;
  this.isLoading = true;
  this.errorMessage = '';

  this.authService.login({ email: this.email, password: this.password }).subscribe({
    next: (tokens: any) => {
      this.isSuccess = true;
      this.isLoading = false;
      const role = tokens.role;
      localStorage.setItem('user_role', role);
      setTimeout(() => {
        if (role === 'kitchen') {
          this.router.navigate(['/kitchen']);
        } else if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/menu']);
        }
      }, 1000);
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      this.isLoading = false;
      if (err.status === 401) {
        this.errorMessage = 'Неверный email или пароль';
      } else if (err.status === 0) {
        this.errorMessage = 'Сервер недоступен. Проверьте подключение.';
      } else {
        this.errorMessage = 'Ошибка сервера. Попробуйте снова.';
      }
      this.cdr.detectChanges();
    }
  });
}

  register(): void {
    if (!this.validate()) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.isSuccess = true;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/menu']), 1000);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.error?.email) {
          this.errorMessage = 'Этот email уже зарегистрирован';
        } else {
          this.errorMessage = 'Ошибка регистрации. Попробуйте снова.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  submit(): void {
    this.mode === 'login' ? this.login() : this.register();
  }

  private validate(): boolean {
    if (this.mode === 'register' && !this.name.trim()) {
      this.errorMessage = 'Введите имя'; return false;
    }
    if (!this.email.trim()) {
      this.errorMessage = 'Введите email'; return false;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'Пароль минимум 6 символов'; return false;
    }
    if (this.mode === 'register' && this.password !== this.confirm) {
      this.errorMessage = 'Пароли не совпадают'; return false;
    }
    return true;
  }
}