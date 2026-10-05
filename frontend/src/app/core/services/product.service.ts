import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  ProductCreateRequest,
  ProductDeleteResponse,
  ProductPublicResponse,
  ProductResponse,
} from '../models/product.model';
import { PageResponse } from '../models/page.model';

export interface ProductListParams {
  categoryId?: number;
  search?: string;
  lang?: 'EN' | 'AL';
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly adminUrl = '/api/admin/products';
  private readonly publicUrl = '/api/products';

  constructor(private http: HttpClient) {}

  createProduct(request: ProductCreateRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.adminUrl, request);
  }

  listAdmin(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.adminUrl);
  }

  getAdmin(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.adminUrl}/${id}`);
  }

  update(id: number, request: ProductCreateRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.adminUrl}/${id}`, request);
  }

  // Smart delete/Archive
  delete(id: number): Observable<ProductDeleteResponse> {
    return this.http.delete<ProductDeleteResponse>(`${this.adminUrl}/${id}`);
  }

  // Brings an archived product back to the store.
  restore(id: number): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.adminUrl}/${id}/restore`, {});
  }

  // --- Gallery images (up to 5 per product) -----------------------------------------------
  addImage(productId: number, file: File): Observable<number[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<number[]>(`${this.adminUrl}/${productId}/images`, formData);
  }

  deleteImage(productId: number, imageId: number): Observable<number[]> {
    return this.http.delete<number[]>(`${this.adminUrl}/${productId}/images/${imageId}`);
  }

  reorderImages(productId: number, imageIds: number[]): Observable<number[]> {
    return this.http.put<number[]>(`${this.adminUrl}/${productId}/images/order`, { imageIds });
  }

  imageUrl(productId: number, imageId: number): string {
    return `${this.publicUrl}/${productId}/images/${imageId}`;
  }

  listPublic(params: ProductListParams = {}): Observable<PageResponse<ProductPublicResponse>> {
    const query: Record<string, string> = {};
    if (params.categoryId != null) query['categoryId'] = String(params.categoryId);
    if (params.search) query['search'] = params.search;
    if (params.lang) query['lang'] = params.lang;
    query['page'] = String(params.page ?? 0);
    query['size'] = String(params.size ?? 20);

    return this.http
      .get<PageResponse<ProductPublicResponse>>(this.publicUrl, { params: query })
      .pipe(retry({ count: 1, delay: 300 }));
  }

  getPublic(id: number, lang: 'EN' | 'AL' = 'AL'): Observable<ProductPublicResponse> {
    return this.http
      .get<ProductPublicResponse>(`${this.publicUrl}/${id}`, { params: { lang } })
      .pipe(retry({ count: 1, delay: 300 }));
  }
}