// admin-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, KitchenAccount } from '../../services/admin.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent implements OnInit {

  cafes: KitchenAccount[] = [];
  isLoading = true;
  errorMessage = '';
  showModal = false;
  isEditing = false;
  isSaving = false;
  toastMessage = '';

  // [(ngModel)] form controls
  formName     = '';   // #1
  formEmoji    = '';   // #2
  formFloor    = '';   // #3
  formEmail    = '';   // #4
  formPassword = '';   // #5
  editId: number | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCafes();
  }

  // Click event #1
  loadCafes(): void {
    this.isLoading = true;
    this.adminService.getKitchens().subscribe({
      next: (data: KitchenAccount[]) => {
        this.cafes = data;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = 'Не удалось загрузить список заведений.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // Click event #2 — открыть форму создания
  openCreate(): void {
    this.isEditing = false;
    this.editId = null;
    this.resetForm();
    this.showModal = true;
  }

  // Click event #3 — открыть форму редактирования
  openEdit(cafe: KitchenAccount): void {
    this.isEditing = true;
    this.editId = cafe.id;
    this.formName     = cafe.name;
    this.formEmoji    = cafe.emoji;
    this.formFloor    = cafe.floor;
    this.formEmail    = cafe.email;
    this.formPassword = '';
    this.showModal = true;
  }

  // Click event #4 — сохранить (создать или обновить)
  save(): void {
    if (!this.formName.trim() || !this.formEmail.trim()) {
      this.errorMessage = 'Заполните обязательные поля.';
      return;
    }
    this.isSaving = true;

    const payload = {
      name:     this.formName,
      emoji:    this.formEmoji || '🍽️',
      floor:    this.formFloor,
      email:    this.formEmail,
      password: this.formPassword,
    };

    const request$ = this.isEditing && this.editId
      ? this.adminService.updateKitchen(this.editId, payload)
      : this.adminService.createKitchen(payload);

    request$.subscribe({
      next: () => {
        this.showModal = false;
        this.isSaving = false;
        this.showToast(this.isEditing ? '✓ Изменения сохранены' : '✓ Аккаунт кухни создан');
        this.loadCafes();
      },
      error: (err: unknown) => {
        this.errorMessage = 'Ошибка при сохранении.';
        this.isSaving = false;
        console.error(err);
      }
    });
  }

  // Click event #5 — удалить заведение
  delete(cafe: KitchenAccount): void {
    if (!confirm(`Удалить "${cafe.name}"?`)) return;
    this.adminService.deleteKitchen(cafe.id).subscribe({
      next: () => {
        this.showToast('✓ Заведение удалено');
        this.loadCafes();
      },
      error: (err: unknown) => console.error(err)
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }

  private resetForm(): void {
    this.formName = this.formEmoji = this.formFloor = this.formEmail = this.formPassword = '';
    this.errorMessage = '';
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => this.toastMessage = '', 2500);
  }

  trackById(_i: number, cafe: KitchenAccount): number { return cafe.id; }
}
