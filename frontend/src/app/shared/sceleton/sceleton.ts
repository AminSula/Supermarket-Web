import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: '',
  styleUrl: './sceleton.scss',
  host: {
    '[style.width]': 'width',
    '[style.height]': 'height',
    '[style.borderRadius]': 'radius',
    class: 'app-skeleton',
  },
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius = '8px';
}