import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-report',
  template: `
    <div class="empty-report" role="status">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
    </div>
  `,
  styles: `
    .empty-report {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--mat-sys-primary); }
    h3 { margin: 0; font: var(--mat-sys-title-medium); color: var(--mat-sys-on-surface); }
    p { margin: 0; max-width: 24rem; }
  `,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyReportComponent {
  readonly icon = input('analytics');
  readonly title = input('No report data');
  readonly description = input('Adjust filters or date range to see results.');
}
