import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-brand-panel',
  imports: [MatIconModule],
  template: `
    <aside class="auth-brand" aria-hidden="true">
      <div class="auth-brand__glow auth-brand__glow--1"></div>
      <div class="auth-brand__glow auth-brand__glow--2"></div>

      <div class="auth-brand__logo">
        <div class="auth-brand__logo-icon">
          <mat-icon aria-hidden="true">task_alt</mat-icon>
        </div>
        <span class="auth-brand__logo-text">{{ appName() }}</span>
      </div>

      <div class="auth-brand__hero">
        <h1 class="auth-brand__headline">{{ headline() }}</h1>
        <p class="auth-brand__tagline">{{ tagline() }}</p>

        <ul class="auth-brand__features">
          @for (feature of features; track feature.text) {
            <li class="auth-brand__feature">
              <span class="auth-brand__feature-icon">
                <mat-icon aria-hidden="true">{{ feature.icon }}</mat-icon>
              </span>
              <span>{{ feature.text }}</span>
            </li>
          }
        </ul>
      </div>

      <p class="auth-brand__footer">Trusted by teams shipping enterprise-grade work.</p>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthBrandPanelComponent {
  readonly appName = input('TaskFlow');
  readonly headline = input('Ship work with clarity.');
  readonly tagline = input(
    'The modern task platform for teams that need visibility, accountability, and speed — without the chaos.',
  );

  protected readonly features = [
    { icon: 'groups', text: 'Collaborate across organizations and projects' },
    { icon: 'bolt', text: 'Real-time dashboards and actionable insights' },
    { icon: 'verified_user', text: 'Enterprise security with role-based access' },
    { icon: 'cloud_done', text: 'Cloud-native architecture built to scale' },
  ];
}
