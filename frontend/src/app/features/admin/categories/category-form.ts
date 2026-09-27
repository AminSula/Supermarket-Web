import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  editingId = signal<number | null>(null);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    nameAl: ['', Validators.required],
    nameEn: ['', Validators.required],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return; // create mode
    }

    const id = Number(idParam);
    this.editingId.set(id);

    this.categoryService.get(id).subscribe({
      next: (category) => {
        const al = category.translations.find((t) => t.language === 'AL')?.name ?? '';
        const en = category.translations.find((t) => t.language === 'EN')?.name ?? '';
        this.form.patchValue({ nameAl: al, nameEn: en });
      },
      error: () => this.errorMessage.set('Could not load this category.'),
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const request = {
      translations: [
        { language: 'AL' as const, name: value.nameAl! },
        { language: 'EN' as const, name: value.nameEn! },
      ],
    };

    const id = this.editingId();
    const save = id ? this.categoryService.update(id, request) : this.categoryService.create(request);

    save.subscribe({
      next: () => this.router.navigate(['/admin/categories']),
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
      },
    });
  }
}