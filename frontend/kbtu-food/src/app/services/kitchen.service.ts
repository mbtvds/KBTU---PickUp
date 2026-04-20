// kitchen.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KitchenOrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  note: string;
}

export interface KitchenOrder {
  id: number;
  status: 'pending' | 'cooking' | 'ready' | 'picked';
  items: KitchenOrderItem[];
  pickup_time: string;
  created_at: string;
  note: string;
}

export interface KitchenMenuItem {
  id: number;
  name: string;
  description: string;
  emoji: string;
  price: number;
  category: string;
  is_available: boolean;
}

export interface MenuItemPayload {
  name: string;
  description: string;
  emoji: string;
  price: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // GET /api/kitchen/orders/  — заказы только своего кафе
  getOrders(): Observable<KitchenOrder[]> {
    return this.http.get<KitchenOrder[]>(`${this.api}/kitchen/orders/`);
  }

  // PATCH /api/kitchen/orders/{id}/  — обновить статус
  updateOrderStatus(id: number, status: string): Observable<KitchenOrder> {
    return this.http.patch<KitchenOrder>(`${this.api}/kitchen/orders/${id}/`, { status });
  }

  // GET /api/kitchen/menu/
  getMenu(): Observable<KitchenMenuItem[]> {
    return this.http.get<KitchenMenuItem[]>(`${this.api}/kitchen/menu/`);
  }

  // POST /api/kitchen/menu/
  createMenuItem(payload: MenuItemPayload): Observable<KitchenMenuItem> {
    return this.http.post<KitchenMenuItem>(`${this.api}/kitchen/menu/`, payload);
  }

  // PUT /api/kitchen/menu/{id}/
  updateMenuItem(id: number, payload: Partial<MenuItemPayload>): Observable<KitchenMenuItem> {
    return this.http.put<KitchenMenuItem>(`${this.api}/kitchen/menu/${id}/`, payload);
  }

  // DELETE /api/kitchen/menu/{id}/
  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/kitchen/menu/${id}/`);
  }

  // GET /api/kitchen/profile/
  getProfile(): Observable<{ name: string; emoji: string; floor: string }> {
    return this.http.get<{ name: string; emoji: string; floor: string }>(`${this.api}/kitchen/profile/`);
  }

  // PATCH /api/kitchen/profile/
  updateProfile(payload: { name: string; emoji: string; floor: string }): Observable<void> {
    return this.http.patch<void>(`${this.api}/kitchen/profile/`, payload);
  }
}
