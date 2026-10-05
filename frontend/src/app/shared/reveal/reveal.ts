import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

export type RevealVariant = '' | 'up' | 'fade' | 'scale' | 'left' | 'right';


// Lazy reveal-on-scroll.

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @Input('appReveal') variant: RevealVariant = 'up';
  @Input() revealDelay = 0;
  @Input() revealDuration = 650; 
  @Input() revealOffset = 22; 

  private observer?: IntersectionObserver;
  private animation?: Animation;

  ngOnInit() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined' || typeof this.el.animate !== 'function') {
      return; // leave the element visible, no animation
    }

    this.el.style.opacity = '0';
    this.el.style.willChange = 'opacity, transform';

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.observer?.disconnect();
          this.observer = undefined;
          this.play();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(this.el);
  }

  private play() {
    const from: Keyframe = { opacity: 0 };
    const o = this.revealOffset;
    switch (this.variant) {
      case 'fade':
        break;
      case 'scale':
        from['transform'] = 'scale(0.94)';
        break;
      case 'left':
        from['transform'] = `translateX(${-o}px)`;
        break;
      case 'right':
        from['transform'] = `translateX(${o}px)`;
        break;
      default:
        from['transform'] = `translateY(${o}px)`;
    }

    this.animation = this.el.animate([from, { opacity: 1, transform: 'none' }], {
      duration: this.revealDuration,
      delay: this.revealDelay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both',
    });

    // Hand the element back to normal styling so hover/active transforms work.
    this.animation.onfinish = () => {
      this.el.style.opacity = '';
      this.el.style.willChange = '';
      this.animation?.cancel();
    };
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.animation?.cancel();
  }
}