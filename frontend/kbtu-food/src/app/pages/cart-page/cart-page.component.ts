import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css']
})
export class CartPageComponent implements OnInit {

  pickupTime  = '13:30';
  payMethod   = 'cash';
  orderNote   = '';
  itemNotes: Record<number, string> = {};

  pickupSlots = ['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00'];

  payMethods = [
    { value: 'cash',   label: 'Наличные при получении' },
    { value: 'card',   label: 'Картой при получении' },
    { value: 'online', label: 'Онлайн-оплата' },
  ];

  isSubmitting = false;
  errorMessage = '';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cartService.items().forEach((ci: CartItem) => {
      this.itemNotes[ci.item.id] = '';
    });
  }

  get items(): CartItem[] {
    return this.cartService.items();
  }

  get total(): number {
    return this.cartService.total();
  }

  get uniqueCafes(): string[] {
    return [...new Set(this.items.map((ci: CartItem) => ci.item.cafe_name))];
  }

  changeQty(itemId: number, delta: number): void {
    this.cartService.changeQuantity(itemId, delta);
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  clearCart(): void {
    if (confirm('Очистить корзину?')) {
      this.cartService.clear();
    }
  }

  placeOrder(): void {
    if (this.cartService.isEmpty()) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      items: this.items.map((ci: CartItem) => ({
        menu_item: ci.item.id,
        quantity:  ci.quantity,
        note:      this.itemNotes[ci.item.id] ?? '',
      })),
      pickup_time: this.pickupTime,
      pay_method:  this.payMethod,
      note:        this.orderNote,
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.cartService.clear();
        this.router.navigate(['/orders']);
      },
      error: (err: unknown) => {
        this.errorMessage = 'Не удалось оформить заказ. Попробуйте снова.';
        this.isSubmitting = false;
        console.error('Order error:', err);
      }
    });
  }

  trackById(_i: number, ci: CartItem): number {
    return ci.item.id;
  }
}