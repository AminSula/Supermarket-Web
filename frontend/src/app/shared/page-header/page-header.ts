import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconComponent],
  template: `
    <header class="page-header">
      <span class="title-icon"><app-icon [name]="icon()" [size]="24" /></span>
      <div class="titles">
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1.5rem;
      }

      @keyframes icon-pop {
        0% {
          transform: scale(0.5) rotate(-12deg);
          opacity: 0;
        }
        100% {
          transform: scale(1) rotate(0);
          opacity: 1;
        }
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .title-icon {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 15px;
        background: var(--accent-gradient);
        color: #fff;
        box-shadow: 0 8px 20px var(--ring);
        animation: icon-pop 0.6s var(--ease-spring) both;
      }

      .titles {
        min-width: 0;
      }

      h1 {
        margin: 0;
        font-size: 1.65rem;
      }

      p {
        margin: 0.15rem 0 0;
        font-size: 0.9rem;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-left: auto;
      }

      /* Phones: smaller title, and the action (e.g. Add product, or a filter) gets its own full-width row */
      @media (max-width: 560px) {
        .page-header {
          gap: 0.75rem;
        }

        .title-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
        }

        h1 {
          font-size: 1.35rem;
        }

        .actions {
          width: 100%;
          margin-left: 0;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  icon = input.required<IconName>();
  title = input.required<string>();
  subtitle = input('');
}