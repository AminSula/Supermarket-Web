import { Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'edit' | 'delete';

// Styled button/link

@Component({
  selector: 'button[appBtn], a[appBtn]',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
    } @else if (icon()) {
      <app-icon class="icon" [name]="icon()!" [size]="iconSize()" [stroke]="2" />
    }
    <span class="label"><ng-content /></span>
  `,
  styleUrl: './button.scss',
  host: {
    '[attr.data-variant]': 'kind()',
    '[class.loading]': 'loading()',
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant | ''>('secondary', { alias: 'appBtn' });
  icon = input<IconName | null>(null);
  loading = input(false);

  kind = computed<ButtonVariant>(() => this.variant() || 'secondary');
  iconSize = computed(() => (this.kind() === 'edit' || this.kind() === 'delete' ? 16 : 18));
}