import { Component, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon';

// Compact "− 3 +" quantity control, clamped between `min` and `max`.

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="stepper" role="group">
      <button
        type="button"
        class="step"
        aria-label="Decrease quantity"
        [disabled]="value() <= min()"
        (click)="set(value() - 1)"
      >
        <app-icon name="minus" [size]="16" [stroke]="2.2" />
      </button>

      <!-- tracking the value re-creates the number on every change, replaying its pop animation -->
      @for (v of [value()]; track v) {
        <span class="qty" aria-live="polite">{{ v }}</span>
      }

      <button
        type="button"
        class="step"
        aria-label="Increase quantity"
        [disabled]="value() >= max()"
        (click)="set(value() + 1)"
      >
        <app-icon name="plus" [size]="16" [stroke]="2.2" />
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      @keyframes qty-pop {
        0% {
          transform: scale(0.6);
          opacity: 0.4;
        }
        60% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 0.1rem;
        padding: 3px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-pill);
      }

      .step {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--text);

        &:hover:not(:disabled) {
          background: var(--accent-soft);
          color: var(--accent);
        }

        &:disabled {
          opacity: 0.35;
        }
      }

      .qty {
        min-width: 2.2rem;
        text-align: center;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        animation: qty-pop 0.3s var(--ease-spring) both;
      }
    `,
  ],
})
export class QuantityStepperComponent {
  value = model(1);
  min = input(1);
  max = input(Number.MAX_SAFE_INTEGER);

  set(next: number) {
    this.value.set(Math.min(Math.max(next, this.min()), this.max()));
  }
}