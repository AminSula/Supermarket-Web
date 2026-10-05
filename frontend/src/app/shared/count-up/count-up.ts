import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';

// Counts a number up from 0 to its real value
@Directive({ selector: '[appCountUp]', standalone: true })
export class CountUpDirective implements OnChanges, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @Input() appCountUp: number | null | undefined = 0;
  @Input() countDecimals = 0;
  @Input() countDuration = 1400; // ms
  @Input() countDelay = 0; // ms

  private shown = 0;
  private started = false;
  private raf = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private observer?: IntersectionObserver;
  private formatter?: Intl.NumberFormat;
  private formatterDecimals = -1;

  ngOnChanges() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.stop();
      this.shown = this.target();
      this.render(this.shown);
      return;
    }

    if (!this.started) {
      if (!this.observer) {
        this.render(0);
        this.observe();
      }
      return;
    }

    this.run(this.shown, this.target(), 0);
  }

  private observe() {
    if (typeof IntersectionObserver === 'undefined') {
      this.begin();
      return;
    }
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.observer?.disconnect();
          this.observer = undefined;
          this.begin();
        }
      },
      { threshold: 0.2 },
    );
    this.observer.observe(this.el);
  }

  private begin() {
    this.started = true;
    this.run(0, this.target(), this.countDelay);
  }

  private run(from: number, to: number, delay: number) {
    this.stop();
    const go = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / this.countDuration);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        this.shown = from + (to - from) * eased;
        this.render(this.shown);
        if (p < 1) {
          this.raf = requestAnimationFrame(step);
        }
      };
      this.raf = requestAnimationFrame(step);
    };
    if (delay > 0) {
      this.timer = setTimeout(go, delay);
    } else {
      go();
    }
  }

  private target(): number {
    return Number(this.appCountUp) || 0;
  }

  private render(value: number) {
    if (!this.formatter || this.formatterDecimals !== this.countDecimals) {
      this.formatterDecimals = this.countDecimals;
      this.formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: this.countDecimals,
        maximumFractionDigits: this.countDecimals,
      });
    }
    this.el.textContent = this.formatter.format(value);
  }

  private stop() {
    cancelAnimationFrame(this.raf);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  ngOnDestroy() {
    this.stop();
    this.observer?.disconnect();
  }
}