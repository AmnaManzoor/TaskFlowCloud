import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-report-card',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <article class="report-card">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <div>
        <h3>{{ title() }}</h3>
        <p>{{ description() }}</p>
      </div>
      <a mat-stroked-button [routerLink]="route()">Open</a>
    </article>
  `,
  styles: `
    .report-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      border-radius: 0.875rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
    }
    h3 { margin: 0; font: var(--mat-sys-title-medium); }
    p { margin: 0.25rem 0 0; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    mat-icon { color: var(--mat-sys-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input('assessment');
  readonly route = input.required<string>();
}
