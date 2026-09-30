import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ProductCreateRequest, ProductPublicResponse, ProductResponse } from '../models/product.model';
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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  // Multipart upload — do NOT set a Content-Type header manually here;
  // the browser needs to set it itself (with the multipart boundary).
  uploadImage(id: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(`${this.adminUrl}/${id}/image`, formData);
  }

  deleteImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}/image`);
  }

  // Used directly as an <img [src]> — no need to fetch-then-blob, the
  // browser can just GET this like any other image URL.
  imageUrl(id: number): string {
    return `${this.publicUrl}/${id}/image`;
  }

  listPublic(params: ProductListParams = {}): Observable<PageResponse<ProductPublicResponse>> {
    const query: Record<string, string> = {};
    if (params.categoryId != null) query['categoryId'] = String(params.categoryId);
    if (params.search) query['search'] = params.search;
    if (params.lang) query['lang'] = params.lang;
    query['page'] = String(params.page ?? 0);
    query['size'] = String(params.size ?? 20);

    // One automatic retry: guards against a transient first-request hiccup
    // (e.g. the dev proxy's very first concurrent requests right after a
    // page load/compile) without masking a real, persistent backend error —
    // a genuine failure still surfaces after the retry fails too.
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