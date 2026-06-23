import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search-box',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="search-box" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <mat-icon matPrefix aria-hidden="true">search</mat-icon>
      <input
        matInput
        type="search"
        [placeholder]="placeholder()"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event)"
        [attr.aria-label]="ariaLabel() ?? label()"
      />
    </mat-form-field>
  `,
  styles: `
    .search-box {
      width: 100%;
      max-width: 24rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent {
  readonly label = input('Search');
  readonly placeholder = input('Search...');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly value = input('');

  readonly valueChange = output<string>();
}
