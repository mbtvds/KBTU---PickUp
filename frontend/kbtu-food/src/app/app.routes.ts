// app.routes.ts
import { Routes } from '@angular/router';
import { LoginPageComponent }  from './pages/login-page/login-page.component';
import { MenuPageComponent }   from './pages/menu-page/menu-page.component';
import { CartPageComponent }   from './pages/cart-page/cart-page.component';
import { OrdersPageComponent } from './pages/orders-page/orders-page.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',       redirectTo: 'menu', pathMatch: 'full' },
  { path: 'login',  component: LoginPageComponent },
  { path: 'menu',   component: MenuPageComponent,   canActivate: [authGuard] },
  { path: 'cart',   component: CartPageComponent,   canActivate: [authGuard] },
  { path: 'orders', component: OrdersPageComponent, canActivate: [authGuard] },
  { path: '**',     redirectTo: 'menu' },
];
