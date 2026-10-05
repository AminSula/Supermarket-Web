import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryPublicResponse } from '../../../core/models/category.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss',
})
export class AddProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  submitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryPublicResponse[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null, Validators.required],
  });

  ngOnInit() {
    this.categoryService.listPublic('AL').subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.errorMessage.set('Could not load categories.'),
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

    this.productService
      .createProduct({
        name: value.name!,
        description: value.description ?? undefined,
        price: value.price!,
        stock: value.stock!,
        categoryId: value.categoryId!,
      })
      .subscribe({
        next: (product) => {
          this.submitting.set(false);
          this.successMessage.set(`"${product.name}" added (id ${product.id}).`);
          this.form.reset();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
        },
      });
  }
}