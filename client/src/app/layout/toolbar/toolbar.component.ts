import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-toolbar',
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar class="toolbar" role="toolbar">
      <ng-content />
    </mat-toolbar>
  `,
  styles: `
    .toolbar {
      margin-bottom: 1rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container);
      min-height: 3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {}
