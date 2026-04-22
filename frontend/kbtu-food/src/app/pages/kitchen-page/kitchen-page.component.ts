import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KitchenService, KitchenOrder, KitchenMenuItem } from '../../services/kitchen.service';
import { interval, Subscription } from 'rxjs';

type Page = 'orders' | 'menu' | 'profile';

@Component({
  selector: 'app-kitchen-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kitchen-page.component.html',
  styleUrls: ['./kitchen-page.component.css']
})
export class KitchenPageComponent implements OnInit, OnDestroy {

  activePage: Page = 'orders';

  orders: KitchenOrder[] = [];
  isLoadingOrders = true;

  menuItems: KitchenMenuItem[] = [];
  isLoadingMenu = false;
  showDishModal = false;
  isEditingDish = false;
  editDishId: number | null = null;
  isSavingDish = false;

  dishName     = '';
  dishDesc     = '';
  dishEmoji    = '';
  dishPrice    = 0;
  dishCategory = 'drinks';
  dishImagePreview: string | null = null;
  dishImageFile: File | null = null;
  profileName  = '';
  profileEmoji = '';
  profileFloor = '';
  isSavingProfile = false;

  toastMessage = '';
  errorMessage = '';

  categories = [
    { id: 'hot',      label: 'Горячее' },
    { id: 'drinks',   label: 'Напитки' },
    { id: 'snacks',   label: 'Закуски' },
    { id: 'desserts', label: 'Десерты' },
  ];

  // Фильтр по кафе
  cafes: { id: number; name: string }[] = [];
  activeCafeFilter: number | null = null;

  get filteredMenuItems(): KitchenMenuItem[] {
    if (!this.activeCafeFilter) return this.menuItems;
    return this.menuItems.filter(i => i.cafe === this.activeCafeFilter);
  }

  private pollSub?: Subscription;

  constructor(
    private kitchenService: KitchenService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadProfile();
    this.pollSub = interval(15000).subscribe(() => {
      if (this.activePage === 'orders') this.loadOrders();
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  switchPage(page: Page): void {
    this.activePage = page;
    if (page === 'menu') this.loadMenu();
    if (page === 'orders') this.loadOrders();
  }

  loadOrders(): void {
    this.kitchenService.getOrders().subscribe({
      next: (data: KitchenOrder[]) => {
        this.orders = data;
        this.isLoadingOrders = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.isLoadingOrders = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  get newOrders():     KitchenOrder[] { return this.orders.filter(o => o.status === 'pending'); }
  get cookingOrders(): KitchenOrder[] { return this.orders.filter(o => o.status === 'cooking'); }
  get readyOrders():   KitchenOrder[] { return this.orders.filter(o => o.status === 'ready'); }

  startCooking(order: KitchenOrder): void {
    this.kitchenService.updateOrderStatus(order.id, 'cooking').subscribe({
      next: () => { this.loadOrders(); this.showToast('▶ Заказ готовится'); },
      error: (err: unknown) => console.error(err)
    });
  }

  markReady(order: KitchenOrder): void {
    this.kitchenService.updateOrderStatus(order.id, 'ready').subscribe({
      next: () => { this.loadOrders(); this.showToast('✓ Заказ готов к выдаче!'); },
      error: (err: unknown) => console.error(err)
    });
  }

  markPicked(order: KitchenOrder): void {
    this.kitchenService.updateOrderStatus(order.id, 'picked').subscribe({
      next: () => { this.loadOrders(); this.showToast('✓ Заказ выдан'); },
      error: (err: unknown) => console.error(err)
    });
  }

  loadMenu(): void {
    this.isLoadingMenu = true;
    this.kitchenService.getMenu().subscribe({
      next: (data: KitchenMenuItem[]) => {
        this.menuItems = data;
        this.cafes = [...new Map(data.map(i => [i.cafe, { id: i.cafe, name: i.cafe_name ?? 'Кафе' }])).values()];
        this.isLoadingMenu = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.isLoadingMenu = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  openAddDish(): void {
  if (!this.activeCafeFilter) {
    alert('Выберите заведение чтобы добавить блюдо');
    return;
  }
  this.isEditingDish = false;
  this.editDishId = null;
  this.dishName = this.dishDesc = this.dishEmoji = '';
  this.dishPrice = 0;
  this.dishCategory = 'drinks';
  this.showDishModal = true;
}

  openEditDish(item: KitchenMenuItem): void {
    this.isEditingDish = true;
    this.editDishId = item.id;
    this.dishName = item.name;
    this.dishDesc = item.description;
    this.dishEmoji = item.emoji;
    this.dishPrice = item.price;
    this.dishCategory = item.category;
    this.showDishModal = true;
  }
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.dishImageFile = input.files[0];const reader = new FileReader();
      reader.onload = (e) => {
        this.dishImagePreview = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveDish(): void {
    if (!this.dishName.trim() || !this.dishPrice) return;
    this.isSavingDish = true;
    
    const payload = {
      name: this.dishName,
      description: this.dishDesc,
      emoji: this.dishEmoji || '🍽️',
      price: this.dishPrice,
      category: this.dishCategory,
      cafe_id: this.activeCafeFilter,
    };

    const req$ = this.isEditingDish && this.editDishId
      ? this.kitchenService.updateMenuItem(this.editDishId, payload)
      : this.kitchenService.createMenuItem(payload);

    req$.subscribe({
      next: () => {
        this.showDishModal = false;
        this.isSavingDish = false;
        this.loadMenu();
        this.showToast(this.isEditingDish ? '✓ Блюдо обновлено' : '✓ Блюдо добавлено');
      },
      error: (err: unknown) => { this.isSavingDish = false; console.error(err); }
    });
  }

  deleteDish(item: KitchenMenuItem): void {
    if (!confirm(`Удалить "${item.name}"?`)) return;
    this.kitchenService.deleteMenuItem(item.id).subscribe({
      next: () => { this.loadMenu(); this.showToast('✓ Блюдо удалено'); },
      error: (err: unknown) => console.error(err)
    });
  }

  loadProfile(): void {
    this.kitchenService.getProfile().subscribe({
      next: (data: { name: string; emoji: string; floor: string }) => {
        this.profileName  = data.name;
        this.profileEmoji = data.emoji;
        this.profileFloor = data.floor;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error(err)
    });
  }

  saveProfile(): void {
    this.isSavingProfile = true;
    this.kitchenService.updateProfile({
      name: this.profileName,
      emoji: this.profileEmoji,
      floor: this.profileFloor,
    }).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.showToast('✓ Профиль обновлён');
        this.cdr.detectChanges();
      },
      error: (err: unknown) => { this.isSavingProfile = false; console.error(err); }
    });
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => { this.toastMessage = ''; this.cdr.detectChanges(); }, 2500);
  }

  trackById(_i: number, o: { id: number }): number { return o.id; }
}