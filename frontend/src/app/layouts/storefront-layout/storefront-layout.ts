import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { IconComponent } from '../../shared/icon/icon';
import { ToolbarControlsComponent } from '../../shared/toolbar-controls/toolbar-controls';

// The buyer's shell: store header (brand, cart, language, theme), the page, and a footer.
@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, IconComponent, ToolbarControlsComponent],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.scss',
})
export class StorefrontLayoutComponent {
  cartService = inject(CartService);
  readonly year = new Date().getFullYear();
}