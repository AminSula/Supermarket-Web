import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CategoryPublicResponse } from '../../../../core/models/category.model';
import { MAX_PRODUCT_IMAGES } from '../../../../core/models/product.model';
import { ButtonComponent } from '../../../../shared/button/button';
import { IconComponent } from '../../../../shared/icon/icon';
import { LazyImgDirective } from '../../../../shared/lazy-img/lazy-img';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header';
import { RevealDirective } from '../../../../shared/reveal/reveal';
import { SelectComponent, SelectOption } from '../../../../shared/select/select';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB 
const LABEL_KEYS = [
  'admin.products.addImage',
  'admin.products.cover',
  'admin.products.setCover',
  'admin.products.newImage',
  'admin.products.removeImage',
  'admin.products.imagesLimit',
  'admin.products.limitReached',
];

interface PendingImage {
  localId: number;
  file: File;
  url: string; 
  status: 'queued' | 'uploading';
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    IconComponent,
    LazyImgDirective,
    PageHeaderComponent,
    RevealDirective,
    SelectComponent,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);

  @ViewChild('fileInput', { static: true }) private fileInput!: ElementRef<HTMLInputElement>;

  editingId = signal<number | null>(null);
  submitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryPublicResponse[]>([]);

  categoryOptions = computed<SelectOption[]>(() =>
    this.categories().map((c) => ({ value: c.id, label: c.name })),
  );

  // --- Images ---------------------------------------------------------------------------
  readonly maxImages = MAX_PRODUCT_IMAGES;
  imageIds = signal<number[]>([]); 
  pending = signal<PendingImage[]>([]);
  busyIds = signal<ReadonlySet<number>>(new Set()); 
  imageError = signal<string | null>(null);
  dragging = signal(false);

  totalImages = computed(() => this.imageIds().length + this.pending().length);
  canAddMore = computed(() => this.totalImages() < this.maxImages);
  isUploading = computed(() => this.pending().some((p) => p.status === 'uploading'));

  private localCounter = 0;
  private queueRunning = false;

  private labels = toSignal(this.translate.stream(LABEL_KEYS), { initialValue: {} as Record<string, string> });

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
        this.imageIds.set(product.imageIds ?? []);
      },
      error: () => this.errorMessage.set('Could not load this product.'),
    });
  }

  ngOnDestroy() {
    this.pending().forEach((p) => URL.revokeObjectURL(p.url));
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  ok(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.valid && control.dirty;
  }

  t(key: string, fallback: string): string {
    const value = this.labels()[key];
    return value && value !== key ? value : fallback;
  }

  imageUrl(imageId: number): string {
    return this.productService.imageUrl(this.editingId()!, imageId);
  }

  isBusy(imageId: number): boolean {
    return this.busyIds().has(imageId);
  }

  // --- Choosing pictures -------------
  openPicker() {
    if (this.canAddMore()) {
      this.fileInput.nativeElement.click();
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = ''; 
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.canAddMore()) {
      this.dragging.set(true);
    }
  }

  onDragLeave() {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private addFiles(files: File[]) {
    this.imageError.set(null);
    if (files.length === 0) {
      return;
    }

    const slots = this.maxImages - this.totalImages();
    const limitMessage = this.t(
      'admin.products.limitReached',
      `You can add up to ${this.maxImages} images per product.`,
    );
    if (slots <= 0) {
      this.imageError.set(limitMessage);
      return;
    }

    const accepted: PendingImage[] = [];
    let truncated = false;

    for (const file of files) {
      if (accepted.length >= slots) {
        truncated = true;
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.imageError.set('Please choose JPEG, PNG, or WebP images.');
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        this.imageError.set('Each image must be 5 MB or smaller.');
        continue;
      }
      accepted.push({ localId: ++this.localCounter, file, url: URL.createObjectURL(file), status: 'queued' });
    }

    if (truncated) {
      this.imageError.set(limitMessage);
    }
    if (accepted.length === 0) {
      return;
    }

    this.pending.update((list) => [...list, ...accepted]);

    const productId = this.editingId();
    if (productId) {
      void this.processQueue(productId);
    }
  }

  private async processQueue(productId: number) {
    if (this.queueRunning) {
      return;
    }
    this.queueRunning = true;

    try {
      while (true) {
        const next = this.pending().find((p) => p.status === 'queued');
        if (!next) {
          break;
        }

        this.pending.update((list) => list.map((p) => (p.localId === next.localId ? { ...p, status: 'uploading' } : p)));

        try {
          const ids = await firstValueFrom(this.productService.addImage(productId, next.file));
          this.imageIds.set(ids);
        } catch (err: any) {
          this.imageError.set(err?.error?.error ?? 'Could not upload an image.');
        }
        this.dropPending(next.localId);
      }
    } finally {
      this.queueRunning = false;
    }
  }

  private dropPending(localId: number) {
    const item = this.pending().find((p) => p.localId === localId);
    if (item) {
      URL.revokeObjectURL(item.url);
    }
    this.pending.update((list) => list.filter((p) => p.localId !== localId));
  }

  // --- Managing pictures ----------------------------------------------------------------
  removePending(localId: number) {
    this.dropPending(localId);
    this.imageError.set(null);
  }

  // New product only
  makePendingCover(localId: number) {
    this.pending.update((list) => {
      const chosen = list.find((p) => p.localId === localId);
      return chosen ? [chosen, ...list.filter((p) => p.localId !== localId)] : list;
    });
  }

  async removeImage(imageId: number) {
    const productId = this.editingId();
    if (!productId || this.isBusy(imageId)) {
      return;
    }

    this.imageError.set(null);
    this.setBusy(imageId, true);
    try {
      this.imageIds.set(await firstValueFrom(this.productService.deleteImage(productId, imageId)));
    } catch (err: any) {
      this.imageError.set(err?.error?.error ?? 'Could not remove the image.');
    } finally {
      this.setBusy(imageId, false);
    }
  }

  async makeCover(imageId: number) {
    const productId = this.editingId();
    if (!productId || this.isBusy(imageId)) {
      return;
    }

    this.imageError.set(null);
    this.setBusy(imageId, true);
    try {
      const order = [imageId, ...this.imageIds().filter((id) => id !== imageId)];
      this.imageIds.set(await firstValueFrom(this.productService.reorderImages(productId, order)));
    } catch (err: any) {
      this.imageError.set(err?.error?.error ?? 'Could not change the cover image.');
    } finally {
      this.setBusy(imageId, false);
    }
  }

  private setBusy(imageId: number, busy: boolean) {
    this.busyIds.update((current) => {
      const next = new Set(current);
      busy ? next.add(imageId) : next.delete(imageId);
      return next;
    });
  }

  // --- Saving the product ---------------------------------------------------------------
  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.imageError.set(null);

    const value = this.form.getRawValue();
    const request = {
      name: value.name!,
      description: value.description ?? undefined,
      price: value.price!,
      stock: value.stock!,
      categoryId: value.categoryId!,
    };

    const id = this.editingId();

    try {
      const saved = await firstValueFrom(
        id ? this.productService.update(id, request) : this.productService.createProduct(request),
      );

      this.editingId.set(saved.id);

      await this.processQueue(saved.id);

      if (this.imageError()) {
        this.submitting.set(false);
        this.errorMessage.set('Product saved, but some images could not be uploaded. You can add them again here.');
        return;
      }

      this.router.navigate(['/admin/products']);
    } catch (err: any) {
      this.submitting.set(false);
      this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
    }
  }
}