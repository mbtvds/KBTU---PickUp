import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { Cafe, MenuItem } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { ReviewService, Review, RatingSummary } from '../../services/review.service';

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

  // Reviews state
  ratings: { [itemId: number]: RatingSummary } = {};
  reviewModalOpen = false;
  reviewModalItem: MenuItem | null = null;
  reviewModalRating = 5;
  reviewModalComment = '';
  reviewModalError = '';
  reviewModalSubmitting = false;
  reviewsListOpen: number | null = null;
  reviewsList: Review[] = [];
  reviewsListLoading = false;

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
    private cdr: ChangeDetectorRef,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.loadCafes();
    this.loadMenu();
  }

  loadCafes(): void {
    this.menuService.getCafes().subscribe({
      next: (data: Cafe[]) => {
        this.cafes = data;
        this.cdr.detectChanges();
      },
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
        this.cdr.detectChanges();
        this.loadAllRatings(data);
      },
      error: (err: unknown) => {
        this.errorMessage = 'Не удалось загрузить меню. Попробуйте снова.';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Menu error:', err);
      }
    });
  }

  // ── Ratings ──────────────────────────────────────────

  loadAllRatings(items: MenuItem[]): void {
    items.forEach(item => {
      this.reviewService.getRating(item.id).subscribe({
        next: (summary) => {
          this.ratings[item.id] = summary;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    });
  }

  getRating(itemId: number): RatingSummary {
    return this.ratings[itemId] ?? { rating: 0, count: 0 };
  }

  getStars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating)) return 'full';
      if (i < rating) return 'half';
      return 'empty';
    });
  }

  // ── Review Modal ─────────────────────────────────────

  openReviewModal(item: MenuItem): void {
    this.reviewModalItem = item;
    this.reviewModalRating = 5;
    this.reviewModalComment = '';
    this.reviewModalError = '';
    this.reviewModalSubmitting = false;
    this.reviewModalOpen = true;
    this.cdr.detectChanges();
  }

  closeReviewModal(): void {
    this.reviewModalOpen = false;
    this.reviewModalItem = null;
    this.cdr.detectChanges();
  }

  setModalRating(r: number): void {
    this.reviewModalRating = r;
  }

  submitReview(): void {
    if (!this.reviewModalItem) return;
    this.reviewModalError = '';
    this.reviewModalSubmitting = true;

    this.reviewService.createReview(this.reviewModalItem.id, {
      rating: this.reviewModalRating,
      comment: this.reviewModalComment,
    }).subscribe({
      next: () => {
        // обновляем рейтинг карточки
        this.reviewService.getRating(this.reviewModalItem!.id).subscribe({
          next: (s) => {
            this.ratings[this.reviewModalItem!.id] = s;
            this.cdr.detectChanges();
          },
          error: () => {}
        });
        this.closeReviewModal();
      },
      error: (err) => {
        this.reviewModalError = err?.error?.detail ?? 'Ошибка при отправке отзыва';
        this.reviewModalSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Reviews List ─────────────────────────────────────

  toggleReviewsList(itemId: number): void {
    if (this.reviewsListOpen === itemId) {
      this.reviewsListOpen = null;
      this.reviewsList = [];
      return;
    }
    this.reviewsListOpen = itemId;
    this.reviewsListLoading = true;
    this.reviewsList = [];

    this.reviewService.getReviews(itemId).subscribe({
      next: (reviews) => {
        this.reviewsList = reviews;
        this.reviewsListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reviewsListLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteReview(reviewId: number, itemId: number): void {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.reviewsList = this.reviewsList.filter(r => r.id !== reviewId);
        this.reviewService.getRating(itemId).subscribe({
          next: (s) => { this.ratings[itemId] = s; this.cdr.detectChanges(); },
          error: () => {}
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ── Filters ──────────────────────────────────────────

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
  trackReview(_i: number, review: Review): number { return review.id; }
}