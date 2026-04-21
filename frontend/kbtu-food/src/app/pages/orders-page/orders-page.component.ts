import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';

type StatusFilter = 'all' | 'pending' | 'cooking' | 'ready' | 'picked' | 'cancelled';

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
    { key: 'all',       label: 'Все' },
    { key: 'pending',   label: 'Ожидает' },
    { key: 'cooking',   label: 'Готовится' },
    { key: 'ready',     label: 'Готово' },
    { key: 'picked',    label: 'Забрано' },
    { key: 'cancelled', label: 'Отменён' },
  ];

  statusLabels: Record<string, string> = {
    pending:   'Ожидает',
    cooking:   'Готовится',
    ready:     'Готово к выдаче',
    picked:    'Забрано',
    cancelled: 'Отменён',
  };

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.orderService.getMyOrders().subscribe({
      next: (data: Order[]) => {
        this.orders = data;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Не удалось загрузить заказы. Попробуйте снова.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  switchTab(tab: StatusFilter): void { this.activeTab = tab; this.applyFilter(); }

  applyFilter(): void {
    this.filteredOrders = this.activeTab === 'all'
      ? this.orders
      : this.orders.filter((o: Order) => o.status === this.activeTab);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'status-pending',
      cooking:   'status-cooking',
      ready:     'status-ready',
      picked:    'status-picked',
      cancelled: 'status-cancelled',
    };
    return map[status] ?? '';
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }

  canCancel(order: Order): boolean { return order.status === 'pending'; }

  reorder(order: Order): void {
    this.orderService.reorder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.errorMessage = 'Не удалось повторить заказ'
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm('Отменить заказ?')) return;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: () => this.errorMessage = 'Не удалось отменить заказ'
    });
  }

  trackById(_index: number, order: Order): number { return order.id; }
}