import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../services/order.service';

type StatusFilter = 'all' | 'pending' | 'ready' | 'picked' | 'cancelled';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.css']
})
export class OrdersPageComponent implements OnInit {

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  activeTab: StatusFilter = 'all';
  isLoading = true;
  errorMessage = '';

  tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all',     label: 'Все' },
    { key: 'pending', label: 'Готовятся' },
    { key: 'ready',   label: 'Готово' },
    { key: 'picked',  label: 'Забрано' },
  ];

  statusLabels: Record<string, string> = {
    pending:   'Готовится',
    ready:     'Готово к выдаче',
    picked:    'Забрано',
    cancelled: 'Отменён',
  };

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getMyOrders().subscribe({
      next: (data: Order[]) => {
        this.orders = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = 'Не удалось загрузить заказы. Попробуйте снова.';
        this.isLoading = false;
        console.error('Orders load error:', err);
      }
    });
  }

  switchTab(tab: StatusFilter): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredOrders = this.activeTab === 'all'
      ? this.orders
      : this.orders.filter((o: Order) => o.status === this.activeTab);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'status-pending',
      ready:     'status-ready',
      picked:    'status-picked',
      cancelled: 'status-cancelled',
    };
    return map[status] ?? '';
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity, 0);
  }

  reorder(order: Order): void {
    this.orderService.reorder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: (err: unknown) => console.error('Reorder error:', err)
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm('Отменить заказ?')) return;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: (err: unknown) => console.error('Cancel error:', err)
    });
  }

  trackById(_index: number, order: Order): number {
    return order.id;
  }
}