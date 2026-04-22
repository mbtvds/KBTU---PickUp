import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(
    private authService: AuthService,
    public cartService: CartService,
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get cartCount(): number {
    return this.cartService.count();
  }

  get cartTotal(): number {
    return this.cartService.total();
  }

  logout() {
    this.authService.clearTokens();
    window.location.href = '/login';
  }
}