import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { Cafe, MenuItem } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.css']
})
export class MenuPageComponent implements OnInit {

  cafes: Cafe[] = [];
  menuItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];

  activeCafeId: number | null = null;
  activeCategory = 'all';
  searchQuery = '';

  isLoading = true;
  errorMessage = '';

  categories = [
    { id: 'all',      label: 'Все' },
    { id: 'hot',      label: 'Горячее' },
    { id: 'drinks',   label: 'Напитки' },
    { id: 'snacks',   label: 'Закуски' },
    { id: 'desserts', label: 'Десерты' },
  ];

  constructor(
    private menuService: MenuService,
    public cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.loadCafes();
    this.loadMenu();
  }

  loadCafes(): void {
    this.menuService.getCafes().subscribe({
      next: (data: Cafe[]) => { this.cafes = data; },
      error: (err: unknown) => console.error('Cafes error:', err),
    });
  }

  loadMenu(): void {
    this.isLoading = true;
    this.menuService.getMenuItems().subscribe({
      next: (data: MenuItem[]) => {
        this.menuItems = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = 'Не удалось загрузить меню. Попробуйте снова.';
        this.isLoading = false;
        console.error('Menu error:', err);
      }
    });
  }

  setCafe(cafeId: number | null): void {
    this.activeCafeId = cafeId;
    this.applyFilters();
  }

  addToCart(item: MenuItem): void {
    this.cartService.addItem(item);
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = this.menuItems.filter((item: MenuItem) => {
      const matchCafe = this.activeCafeId === null || item.cafe === this.activeCafeId;
      const matchCat  = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchQ    = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return matchCafe && matchCat && matchQ;
    });
  }

  isInCart(item: MenuItem): boolean {
    return this.cartService.hasItem(item.id);
  }

  get activeCafeName(): string {
    if (!this.activeCafeId) return 'Все блюда';
    return this.cafes.find((c: Cafe) => c.id === this.activeCafeId)?.name ?? 'Все блюда';
  }

  trackById(_i: number, item: MenuItem): number { return item.id; }
  trackCafe(_i: number, cafe: Cafe): number { return cafe.id; }
}