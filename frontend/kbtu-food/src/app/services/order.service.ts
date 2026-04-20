import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  cafe_name: string;
  cafe_icon: string;
  status: 'pending' | 'ready' | 'picked' | 'cancelled';
  items: OrderItem[];
  pickup_time: string;
  created_at: string;
}

export interface CreateOrderPayload {
  items: { menu_item: number; quantity: number; note: string }[];
  pickup_time: string;
  pay_method: string;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/orders/`);
  }

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.api}/orders/`, payload);
  }

  reorder(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${this.api}/orders/${orderId}/reorder/`, {});
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.http.patch<Order>(`${this.api}/orders/${orderId}/`, { status: 'cancelled' });
  }
}
