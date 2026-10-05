import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/button/button';
import { IconComponent } from '../../shared/icon/icon';
import { RevealDirective } from '../../shared/reveal/reveal';
import { ToolbarControlsComponent } from '../../shared/toolbar-controls/toolbar-controls';

// The owner's shell: topbar + sidebar with the four admin sections
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    ButtonComponent,
    IconComponent,
    RevealDirective,
    ToolbarControlsComponent,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}