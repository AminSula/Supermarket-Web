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
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors the backend's limit

// Text for the image manager. Each has an English fallback, so the page reads fine even
// before the matching keys are added to the en.json / al.json translation files.
const LABEL_KEYS = [
  'admin.products.addImage',
  'admin.products.cover',
  'admin.products.setCover',
  'admin.products.newImage',
  'admin.products.removeImage',
  'admin.products.imagesLimit',
  'admin.products.limitReached',
];

// One picture in the product's gallery, in display order (the first one is the cover).
// Changes are only STAGED in the browser — nothing is sent to the server until Save, and
// Cancel simply throws them away.
//  - saved: already stored on the server
//  - new:   chosen by the owner, still only in the browser (uploaded on Save)
type GalleryItem =
  | { key: string; kind: 'saved'; id: number }
  | { key: string; kind: 'new'; file: File; url: string }; // url = local preview (object URL)

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

  // Options for the custom dropdown.
  categoryOptions = computed<SelectOption[]>(() =>
    this.categories().map((c) => ({ value: c.id, label: c.name })),
  );

  // --- Images ---------------------------------------------------------------------------
  // Adding, removing and "set as cover" only change `gallery` in the browser. Pressing Save
  // applies them to the server (see syncImages); pressing Cancel discards them.
  readonly maxImages = MAX_PRODUCT_IMAGES;
  gallery = signal<GalleryItem[]>([]);
  imageError = signal<string | null>(null);
  dragging = signal(false);

  totalImages = computed(() => this.gallery().length);
  canAddMore = computed(() => this.totalImages() < this.maxImages);

  private serverIds: number[] = []; // image ids as they are stored on the server right now
  private localCounter = 0;

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
        this.setGalleryFromServer(product.imageIds ?? []);
      },
      error: () => this.errorMessage.set('Could not load this product.'),
    });
  }

  ngOnDestroy() {
    this.revokeNewUrls();
  }

  // Field is invalid AND the user has interacted with it -> show the error state.
  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  // Field is valid AND has been edited -> show the green tick.
  ok(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.valid && control.dirty;
  }

  // Translated label, or the English fallback if the key isn't in the language files yet.
  t(key: string, fallback: string): string {
    const value = this.labels()[key];
    return value && value !== key ? value : fallback;
  }

  itemUrl(item: GalleryItem): string {
    return item.kind === 'saved' ? this.productService.imageUrl(this.editingId()!, item.id) : item.url;
  }

  // --- Choosing pictures (button, drop zone or drag & drop; several at once) -------------
  openPicker() {
    if (this.canAddMore()) {
      this.fileInput.nativeElement.click();
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = ''; // lets the owner pick the same file again later
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

    const accepted: GalleryItem[] = [];
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
      accepted.push({ key: `n${++this.localCounter}`, kind: 'new', file, url: URL.createObjectURL(file) });
    }

    if (truncated) {
      this.imageError.set(limitMessage);
    }
    if (accepted.length > 0) {
      this.gallery.update((list) => [...list, ...accepted]);
    }
  }

  // --- Managing pictures (staged — nothing is saved until the owner presses Save) --------
  removeItem(key: string) {
    const item = this.gallery().find((g) => g.key === key);
    if (item?.kind === 'new') {
      URL.revokeObjectURL(item.url);
    }
    this.gallery.update((list) => list.filter((g) => g.key !== key));
    this.imageError.set(null);
  }

  // Moves a picture to the front so it becomes the cover.
  makeCover(key: string) {
    this.gallery.update((list) => {
      const chosen = list.find((g) => g.key === key);
      return chosen ? [chosen, ...list.filter((g) => g.key !== key)] : list;
    });
  }

  private setGalleryFromServer(ids: number[]) {
    this.revokeNewUrls();
    this.serverIds = ids;
    this.gallery.set(ids.map((id) => ({ key: `s${id}`, kind: 'saved' as const, id })));
  }

  private revokeNewUrls() {
    this.gallery().forEach((g) => {
      if (g.kind === 'new') {
        URL.revokeObjectURL(g.url);
      }
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

      // From here on this is an existing product — so pressing Save again updates it
      // instead of creating a duplicate.
      this.editingId.set(saved.id);

      // Apply the staged image changes.
      const imagesOk = await this.syncImages(saved.id);
      if (!imagesOk) {
        // The product itself is saved either way; don't strand the owner with nothing saved.
        this.submitting.set(false);
        this.errorMessage.set('Product saved, but some image changes could not be applied. Please check the images below.');
        return;
      }

      this.router.navigate(['/admin/products']);
    } catch (err: any) {
      this.submitting.set(false);
      this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
    }
  }

  // Makes the server's images match the gallery the owner arranged:
  // delete removed ones first (frees slots), upload the new ones, then fix the order.
  private async syncImages(productId: number): Promise<boolean> {
    const items = this.gallery();
    const keptIds = new Set(items.filter((g) => g.kind === 'saved').map((g) => (g as { id: number }).id));
    const toDelete = this.serverIds.filter((id) => !keptIds.has(id));
    const toUpload = items.filter((g): g is Extract<GalleryItem, { kind: 'new' }> => g.kind === 'new');

    try {
      let currentIds = [...this.serverIds];

      for (const id of toDelete) {
        currentIds = await firstValueFrom(this.productService.deleteImage(productId, id));
      }

      // Uploaded one after another, so each new picture's server id is the one that just appeared.
      const newIdByKey = new Map<string, number>();
      for (const item of toUpload) {
        const before = new Set(currentIds);
        currentIds = await firstValueFrom(this.productService.addImage(productId, item.file));
        const created = currentIds.find((id) => !before.has(id));
        if (created != null) {
          newIdByKey.set(item.key, created);
        }
      }

      // Final order = the order of the tiles.
      const desired = items
        .map((g) => (g.kind === 'saved' ? g.id : newIdByKey.get(g.key)))
        .filter((id): id is number => id != null);
      const orderDiffers = desired.length === currentIds.length && desired.some((id, i) => id !== currentIds[i]);
      if (orderDiffers) {
        currentIds = await firstValueFrom(this.productService.reorderImages(productId, desired));
      }

      this.setGalleryFromServer(currentIds);
      return true;
    } catch (err: any) {
      this.imageError.set(err?.error?.error ?? 'Some image changes could not be saved.');
      // Show what is really stored now, so the tiles don't lie.
      try {
        const product = await firstValueFrom(this.productService.getAdmin(productId));
        this.setGalleryFromServer(product.imageIds ?? []);
      } catch {
        /* keep the staged view if even the reload fails */
      }
      return false;
    }
  }
}