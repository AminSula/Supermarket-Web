import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryPublicResponse } from '../../../../core/models/category.model';


const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors the backend's limit

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  editingId = signal<number | null>(null);
  submitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryPublicResponse[]>([]);

  // Image state. selectedFile is only set when the owner picks a NEW file
  // (upload happens after the product itself is saved). existingImage
  // reflects what's already stored on the server for this product.
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  existingImage = signal(false);
  imageError = signal<string | null>(null);

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

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return; // create mode
    }

    const id = Number(idParam);
    this.editingId.set(id);

    this.productService.getAdmin(id).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
        });
        this.existingImage.set(product.hasImage);
      },
      error: () => this.errorMessage.set('Could not load this product.'),
    });
  }

  imageUrl(id: number): string {
    return this.productService.imageUrl(id);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageError.set(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.imageError.set('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      this.imageError.set('Image must be 5 MB or smaller.');
      return;
    }

    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  // Clears a newly picked (not yet uploaded) file, reverting to whatever
  // image is already saved, if any.
  clearSelectedFile() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  // Removes the image already stored on the server. Only relevant in edit
  // mode — a new product has no server-side image to remove yet.
  removeExistingImage() {
    const id = this.editingId();
    if (!id) {
      return;
    }

    this.productService.deleteImage(id).subscribe({
      next: () => this.existingImage.set(false),
      error: () => this.imageError.set('Could not remove the image.'),
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
    const request = {
      name: value.name!,
      description: value.description ?? undefined,
      price: value.price!,
      stock: value.stock!,
      categoryId: value.categoryId!,
    };

    const id = this.editingId();
    const save = id ? this.productService.update(id, request) : this.productService.createProduct(request);

    save.subscribe({
      next: (savedProduct) => {
        const file = this.selectedFile();
        if (!file) {
          this.router.navigate(['/admin/products']);
          return;
        }

        // Product is saved either way at this point — an image upload
        // failure shouldn't strand the owner on the form with nothing saved.
        this.productService.uploadImage(savedProduct.id, file).subscribe({
          next: () => this.router.navigate(['/admin/products']),
          error: () => {
            this.submitting.set(false);
            this.errorMessage.set(
              'Product saved, but the image failed to upload. You can try again from the edit page.'
            );
          },
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
      },
    });
  }
}