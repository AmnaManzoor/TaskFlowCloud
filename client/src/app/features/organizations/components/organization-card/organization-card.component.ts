import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import type { Organization } from '@features/organizations/models/organization.models';

@Component({
  selector: 'app-organization-card',
  imports: [MatButtonModule, MatIconModule, RouterLink, StatusBadgeComponent],
  template: `
    <article class="org-card u-animate-fade-in">
      <div class="org-card__header">
        @if (organization().logoUrl) {
          <img [src]="organization().logoUrl!" [alt]="organization().name + ' logo'" class="org-card__logo" />
        } @else {
          <div class="org-card__logo org-card__logo--placeholder" aria-hidden="true">
            <mat-icon>business</mat-icon>
          </div>
        }
        <div>
          <h3 class="org-card__title">{{ organization().name }}</h3>
          <app-status-badge
            [label]="organization().isActive ? 'Active' : 'Inactive'"
            [variant]="organization().isActive ? 'success' : 'warning'"
          />
        </div>
      </div>
      @if (organization().description) {
        <p class="org-card__description">{{ organization().description }}</p>
      }
      <div class="org-card__actions">
        <a mat-stroked-button [routerLink]="['/organizations', organization().id]">Open</a>
        @if (showManage()) {
          <a mat-button [routerLink]="['/organizations', organization().id, 'edit']">Edit</a>
        }
      </div>
    </article>
  `,
  styles: `
    .org-card {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      transition: box-shadow 180ms ease, transform 180ms ease;
    }

    .org-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgb(15 23 42 / 8%);
    }

    .org-card__header {
      display: flex;
      gap: 0.875rem;
      align-items: center;
    }

    .org-card__logo {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      object-fit: cover;
    }

    .org-card__logo--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .org-card__title {
      margin: 0 0 0.375rem;
      font: var(--mat-sys-title-medium);
    }

    .org-card__description {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .org-card__actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCardComponent {
  readonly organization = input.required<Organization>();
  readonly showManage = input(true);
}
