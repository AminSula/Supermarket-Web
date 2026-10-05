import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Theme = 'light' | 'dark';
export type Lang = 'en' | 'al';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private translate = inject(TranslateService);

  readonly theme = signal<Theme>((localStorage.getItem('theme') as Theme) ?? 'light');
  readonly lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'al');

  constructor() {
    this.translate.addLangs(['en', 'al']);
    this.translate.use(this.lang());
    this.applyTheme(this.theme());
  }

  toggleTheme() {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    this.applyTheme(next);
  }

  switchLang(lang: Lang) {
    this.lang.set(lang);
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}