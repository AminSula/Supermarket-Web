import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

// Lazy-loads an image and fades/zooms it in once it has actually loaded.
@Directive({ selector: 'img[appLazy]', standalone: true })
export class LazyImgDirective implements AfterViewInit {
  private img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  constructor() {
    this.img.loading = 'lazy';
    this.img.decoding = 'async';

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.img.style.opacity = '0';
    this.img.style.transform = 'scale(1.06)';
    this.img.style.transition = 'opacity 0.55s ease, transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)';
    this.img.addEventListener('load', this.reveal, { once: true });
    this.img.addEventListener('error', this.reveal, { once: true });
  }

  // Cached images can finish loading before the listener above runs.
  ngAfterViewInit() {
    if (this.img.complete && this.img.naturalWidth > 0) {
      this.reveal();
    }
  }

  private reveal = () => {
    this.img.style.opacity = '';
    this.img.style.transform = '';
  };
}