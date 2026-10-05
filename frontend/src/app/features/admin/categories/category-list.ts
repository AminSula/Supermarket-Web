import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { ButtonComponent } from '../../../shared/button/button';
import { IconComponent } from '../../../shared/icon/icon';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { RevealDirective } from '../../../shared/reveal/reveal';
import { SkeletonComponent } from '../../../shared/sceleton/sceleton';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ConfirmDialogComponent,
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
    RevealDirective,
    SkeletonComponent,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  pendingDeleteId = signal<number | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.categoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load categories.');
        this.loading.set(false);
      },
    });
  }

  nameFor(category: CategoryResponse, lang: 'EN' | 'AL'): string {
    return category.translations.find((t) => t.language === lang)?.name ?? '—';
  }

  askDelete(id: number) {
    this.pendingDeleteId.set(id);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
  }

  confirmDelete() {
    const id = this.pendingDeleteId();
    if (id == null) {
      return;
    }

    this.categoryService.delete(id).subscribe({
      next: () => {
        this.pendingDeleteId.set(null);
        this.load();
      },
      error: (err) => {
        this.pendingDeleteId.set(null);
        this.errorMessage.set(err?.error?.error ?? 'Could not delete this category.');
      },
    });
  }
}