import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { evaluatePasswordStrength } from '@core/authentication/validators/auth.validators';

@Component({
  selector: 'app-password-strength',
  imports: [MatIconModule],
  template: `
    @if (password()) {
      <div class="strength" aria-live="polite">
        <div class="strength__header">
          <span class="strength__label">Password strength</span>
          <span class="strength__badge" [class]="'strength__badge--' + strength().label.toLowerCase()">
            {{ strength().label }}
          </span>
        </div>

        <div class="strength__segments" role="progressbar" [attr.aria-valuenow]="strength().score" aria-valuemin="0" aria-valuemax="5">
          @for (segment of segments; track segment) {
            <span
              class="strength__segment"
              [class.strength__segment--active]="segment <= strength().score"
              [class]="'strength__segment--' + strength().label.toLowerCase()"
            ></span>
          }
        </div>

        <ul class="strength__checks">
          @for (check of checkItems(); track check.key) {
            <li class="strength__check" [class.strength__check--ok]="check.met">
              <mat-icon aria-hidden="true">{{ check.met ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>{{ check.label }}</span>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .strength {
      margin-top: 0.25rem;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .strength__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
    }

    .strength__label {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    .strength__badge {
      font: var(--mat-sys-label-small);
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .strength__badge--weak {
      background: #ffebee;
      color: #c62828;
    }

    .strength__badge--fair {
      background: #fff8e1;
      color: #f57f17;
    }

    .strength__badge--good {
      background: #e3f2fd;
      color: #1565c0;
    }

    .strength__badge--strong {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .strength__segments {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.375rem;
      margin-bottom: 0.75rem;
    }

    .strength__segment {
      height: 0.3rem;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-highest);
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .strength__segment--active.strength__segment--weak {
      background: #ef5350;
    }

    .strength__segment--active.strength__segment--fair {
      background: #ffa726;
    }

    .strength__segment--active.strength__segment--good {
      background: #42a5f5;
    }

    .strength__segment--active.strength__segment--strong {
      background: #66bb6a;
    }

    .strength__checks {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.375rem 0.75rem;
    }

    .strength__check {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
      transition: color 0.15s ease;
    }

    .strength__check mat-icon {
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }

    .strength__check--ok {
      color: var(--mat-sys-primary);
    }

    :host-context(.theme-dark) .strength__badge--weak {
      background: rgb(198 40 40 / 25%);
      color: #ef9a9a;
    }

    :host-context(.theme-dark) .strength__badge--fair {
      background: rgb(245 127 23 / 25%);
      color: #ffcc80;
    }

    :host-context(.theme-dark) .strength__badge--good {
      background: rgb(21 101 192 / 25%);
      color: #90caf9;
    }

    :host-context(.theme-dark) .strength__badge--strong {
      background: rgb(46 125 50 / 25%);
      color: #a5d6a7;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  readonly password = input('');

  protected readonly segments = [1, 2, 3, 4, 5];
  readonly strength = computed(() => evaluatePasswordStrength(this.password()));

  readonly checkItems = computed(() => {
    const checks = this.strength().checks;
    return [
      { key: 'minLength', label: '8+ characters', met: checks.minLength },
      { key: 'uppercase', label: 'Uppercase', met: checks.uppercase },
      { key: 'lowercase', label: 'Lowercase', met: checks.lowercase },
      { key: 'number', label: 'Number', met: checks.number },
      { key: 'special', label: 'Special char', met: checks.special },
    ];
  });
}
