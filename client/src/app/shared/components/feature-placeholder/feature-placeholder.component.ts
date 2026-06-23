import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-feature-placeholder',
  imports: [PageHeaderComponent, EmptyStateComponent, MatToolbarModule],
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()" />
    <mat-toolbar class="toolbar" role="toolbar" aria-label="Feature toolbar">
      <span>Feature module placeholder</span>
    </mat-toolbar>
    <app-empty-state
      [title]="emptyTitle()"
      [description]="description()"
      icon="construction"
    />
  `,
  styles: `
    .toolbar {
      margin-bottom: 1rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container);
      font: var(--mat-sys-body-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePlaceholderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('This module will be implemented in a future prompt.');
  readonly emptyTitle = input('Coming soon');
  readonly description = input(
    'The foundation is ready. Business functionality will be added in upcoming feature prompts.',
  );
}
