import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  imports: [MatCardModule],
  template: `
    <mat-card [class.card--padding-none]="!padding()">
      @if (title()) {
        <mat-card-header>
          <mat-card-title>{{ title() }}</mat-card-title>
          @if (subtitle()) {
            <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
          }
        </mat-card-header>
      }
      <mat-card-content>
        <ng-content />
      </mat-card-content>
      <mat-card-actions align="end">
        <ng-content select="[card-actions]" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .card--padding-none mat-card-content {
      padding: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly padding = input(true);
}
