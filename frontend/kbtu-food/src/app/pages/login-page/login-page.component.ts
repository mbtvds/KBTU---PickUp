import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
      next: () => {
        this.isSuccess = true;
        setTimeout(() => this.router.navigate(['/menu']), 1000);
      },
      error: (err: { status: number }) => {
        this.errorMessage = err.status === 401
          ? 'Неверный email или пароль'
          : 'Ошибка сервера. Попробуйте снова.';
        this.isLoading = false;
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
        setTimeout(() => this.router.navigate(['/menu']), 1000);
      },
      error: (err: { error?: { email?: string } }) => {
        this.errorMessage = err.error?.email
          ? 'Этот email уже зарегистрирован'
          : 'Ошибка регистрации. Попробуйте снова.';
        this.isLoading = false;
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