import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id: number;
  menu_item: number;
  student: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface RatingSummary {
  rating: number;
  count: number;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {

  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getReviews(menuItemId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/menu-items/${menuItemId}/reviews/`);
  }

  getRating(menuItemId: number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.api}/menu-items/${menuItemId}/rating/`);
  }

  createReview(menuItemId: number, payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<Review>(`${this.api}/menu-items/${menuItemId}/reviews/create/`, payload);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/reviews/${reviewId}/delete/`);
  }
}