import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  CategoryPublicResponse,
  CategoryRequest,
  CategoryResponse,
} from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly adminUrl = '/api/admin/categories';
  private readonly publicUrl = '/api/categories';

  constructor(private http: HttpClient) {}

  list(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.adminUrl);
  }

  get(id: number): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.adminUrl}/${id}`);
  }

  create(request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.adminUrl, request);
  }

  update(id: number, request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.adminUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  // Used by the product form's category dropdown — resolved names only.
  // Same one-time retry as ProductService.listPublic, for the same reason:
  // this fires in parallel with the products request on catalog page load.
  listPublic(lang: 'EN' | 'AL' = 'AL'): Observable<CategoryPublicResponse[]> {
    return this.http
      .get<CategoryPublicResponse[]>(this.publicUrl, { params: { lang } })
      .pipe(retry({ count: 1, delay: 300 }));
  }
}