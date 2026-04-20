// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KitchenAccount {
  id: number;
  name: string;
  emoji: string;
  floor: string;
  email: string;
}

export interface KitchenPayload {
  name: string;
  emoji: string;
  floor: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // GET /api/admin/kitchens/
  getKitchens(): Observable<KitchenAccount[]> {
    return this.http.get<KitchenAccount[]>(`${this.api}/admin/kitchens/`);
  }

  // POST /api/admin/kitchens/  — создать аккаунт кухни
  createKitchen(payload: KitchenPayload): Observable<KitchenAccount> {
    return this.http.post<KitchenAccount>(`${this.api}/admin/kitchens/`, payload);
  }

  // PUT /api/admin/kitchens/{id}/
  updateKitchen(id: number, payload: Partial<KitchenPayload>): Observable<KitchenAccount> {
    return this.http.put<KitchenAccount>(`${this.api}/admin/kitchens/${id}/`, payload);
  }

  // DELETE /api/admin/kitchens/{id}/
  deleteKitchen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/kitchens/${id}/`);
  }
}
