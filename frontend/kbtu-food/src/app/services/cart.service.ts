import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from './menu.service';

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private _items = signal<CartItem[]>([]);

  readonly items   = this._items.asReadonly();
  readonly count   = computed(() => this._items().reduce((s: number, c: CartItem) => s + c.quantity, 0));
  readonly total   = computed(() => this._items().reduce((s: number, c: CartItem) => s + c.item.price * c.quantity, 0));
  readonly isEmpty = computed(() => this._items().length === 0);

  addItem(item: MenuItem): void {
    this._items.update((current: CartItem[]) => {
      const idx = current.findIndex((c: CartItem) => c.item.id === item.id);
      if (idx > -1) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...current, { item, quantity: 1 }];
    });
  }

  removeItem(itemId: number): void {
    this._items.update((c: CartItem[]) => c.filter((ci: CartItem) => ci.item.id !== itemId));
  }

  changeQuantity(itemId: number, delta: number): void {
    this._items.update((current: CartItem[]) => {
      const idx = current.findIndex((c: CartItem) => c.item.id === itemId);
      if (idx === -1) return current;
      const newQty = current[idx].quantity + delta;
      if (newQty <= 0) return current.filter((c: CartItem) => c.item.id !== itemId);
      const updated = [...current];
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  }

  hasItem(itemId: number): boolean {
    return this._items().some((c: CartItem) => c.item.id === itemId);
  }

  clear(): void {
    this._items.set([]);
  }
}
