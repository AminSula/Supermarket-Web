import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  // Light/dark mode: signal-driven, persisted, applied as a data-attribute
  // on <html> so styles.scss can theme via CSS variables.
  theme = signal<Theme>((localStorage.getItem('theme') as Theme) ?? 'light');

  // EN/AL language switcher.
  lang = signal<'en' | 'al'>((localStorage.getItem('lang') as 'en' | 'al') ?? 'al');

  constructor(private translate: TranslateService) {
    translate.addLangs(['en', 'al']);
    translate.use(this.lang());
    this.applyTheme(this.theme());
  }

  toggleTheme() {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    this.applyTheme(next);
  }

  switchLang(lang: 'en' | 'al') {
    this.lang.set(lang);
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}