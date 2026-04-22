import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cafe {
  id: number;
  name: string;
  emoji: string;
  floor: string;
}

export interface MenuItem {
  id: number;
  cafe: number;
  cafe_name: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
  category: string;
  tags: string[];
  is_available: boolean;
  image: string | null;
}

@Injectable({ providedIn: 'root' })
export class MenuService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getCafes(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.api}/cafes/`);
  }

  getMenuItems(cafeId?: number, category?: string): Observable<MenuItem[]> {
    let params = new HttpParams();
    if (cafeId)   params = params.set('cafe', cafeId);
    if (category) params = params.set('category', category);
    return this.http.get<MenuItem[]>(`${this.api}/menu-items/`, { params });
  }
}
