import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/button/button';
import { IconComponent } from '../../../shared/icon/icon';
import { RevealDirective } from '../../../shared/reveal/reveal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonComponent, IconComponent, RevealDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.has('sessionExpired')) {
      const key = 'admin.login.sessionExpired';
      this.translate.get(key).subscribe((text: string) => {
        this.errorMessage.set(text === key ? 'Your session expired. Please log in again.' : text);
      });
    }
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  private afterLoginUrl(): string {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    const safe = !!target && target.startsWith('/admin') && !target.startsWith('/admin/login') && !target.startsWith('//');
    return safe ? target! : '/admin/dashboard';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

    this.authService.login({ username: value.username!, password: value.password! }).subscribe({
      next: () => this.router.navigateByUrl(this.afterLoginUrl()),
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.error ?? 'Login failed. Please try again.');
      },
    });
  }
}