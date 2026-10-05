import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarControlsComponent } from '../../shared/toolbar-controls/toolbar-controls';

// Bare shell for the owner login
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ToolbarControlsComponent],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayoutComponent {}