import { Component } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button 
      class="theme-toggle" 
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (themeService.currentTheme() === 'light' ? 'dark' : 'light') + ' mode'"
      title="Toggle theme">
      <span class="theme-icon">{{ themeService.currentTheme() === 'light' ? '🌙' : '☀️' }}</span>
      <span class="theme-text">{{ themeService.currentTheme() === 'light' ? 'Dark' : 'Light' }}</span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .theme-toggle:hover {
      background-color: var(--bg-secondary);
      border-color: var(--link-color);
    }

    .theme-icon {
      font-size: 1rem;
    }

    .theme-text {
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .theme-text {
        display: none;
      }
      
      .theme-toggle {
        padding: 0.5rem;
      }
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}