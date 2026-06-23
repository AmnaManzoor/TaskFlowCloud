import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer" role="contentinfo">
      <span>{{ appName() }} &copy; {{ year }}</span>
      @if (version()) {
        <span class="footer__version">v{{ version() }}</span>
      }
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly appName = input('TaskFlow');
  readonly version = input('1.0.0');

  protected readonly year = new Date().getFullYear();
}
