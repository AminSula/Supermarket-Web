import { Component, ElementRef, OnDestroy, ViewChild, computed, input, signal } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { LazyImgDirective } from '../lazy-img/lazy-img';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [IconComponent, LazyImgDirective],
  templateUrl: './image-carousel.html',
  styleUrl: './image-carousel.scss',
})
export class ImageCarouselComponent implements OnDestroy {
  urls = input<string[]>([]);
  alt = input('');

  @ViewChild('track', { static: true }) private trackRef!: ElementRef<HTMLElement>;

  active = signal(0);
  count = computed(() => this.urls().length);

  private frame = 0;

  onScroll() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const track = this.trackRef.nativeElement;
      if (!track.clientWidth) {
        return;
      }
      const index = Math.round(track.scrollLeft / track.clientWidth);
      this.active.set(Math.min(Math.max(index, 0), this.count() - 1));
    });
  }

  goTo(index: number) {
    const target = Math.min(Math.max(index, 0), this.count() - 1);
    const track = this.trackRef.nativeElement;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    track.scrollTo({ left: target * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }

  next() {
    this.goTo(this.active() + 1);
  }

  prev() {
    this.goTo(this.active() - 1);
  }

  onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
  }
}