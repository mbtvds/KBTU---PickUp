import { Component, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
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
export class App implements AfterViewChecked {

  constructor(
    private authService: AuthService,
    public cartService: CartService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get cartCount(): number {
    return this.cartService.count();
  }

  get cartTotal(): number {
    return this.cartService.total();
  }
  get isKitchen(): boolean {
    return this.authService.getRole() === 'kitchen';
  }

  logout() {
    this.authService.clearTokens();
    window.location.href = '/login';
  }
}