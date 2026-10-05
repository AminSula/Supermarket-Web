import { Directive, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';

// Adds the class `in-view` to the host the first time it scrolls into view.
@Directive({
  selector: '[appInView]',
  standalone: true,
  host: { '[class.in-view]': 'inView()' },
})
export class InViewDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private observer?: IntersectionObserver;

  inView = signal(false);

  ngOnInit() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      this.inView.set(true);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.inView.set(true);
          this.observer?.disconnect();
          this.observer = undefined;
        }
      },
      { threshold: 0.2 },
    );
    this.observer.observe(this.el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}