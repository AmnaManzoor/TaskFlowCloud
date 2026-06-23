import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PasswordStrengthComponent } from '@core/authentication/components/password-strength/password-strength.component';

@Component({
  selector: 'app-password-input',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    PasswordStrengthComponent,
  ],
  template: `
    <mat-form-field appearance="outline" class="password-input">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [formControl]="control()"
        [type]="visible() ? 'text' : 'password'"
        [autocomplete]="autocomplete()"
        [attr.aria-label]="label()"
      />
      <button
        mat-icon-button
        matSuffix
        type="button"
        (click)="toggleVisibility()"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
      >
        <mat-icon aria-hidden="true">{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      @if (errorMessage()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>

    @if (showStrength()) {
      <app-password-strength [password]="control().value" />
    }
  `,
  styles: `
    .password-input {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input('Password');
  readonly autocomplete = input('current-password');
  readonly errorMessage = input<string | null>(null);
  readonly showStrength = input(false);

  protected readonly visible = signal(false);

  protected toggleVisibility(): void {
    this.visible.update((value) => !value);
  }
}
