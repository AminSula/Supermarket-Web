import { Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-toolbar-controls',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toolbar-controls.html',
  styleUrl: './toolbar-controls.scss',
})
export class ToolbarControlsComponent {
  prefs = inject(PreferencesService);
}