import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';
import { TeamStore } from '@features/organizations/stores/team.store';

@Component({
  selector: 'app-organization-details-page',
  imports: [MatCardModule, MatButtonModule, RouterLink, StatusBadgeComponent, DatePipe],
  template: `
    @if (store.selected(); as org) {
      <div class="overview-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Organization overview</mat-card-title>
          </mat-card-header>
          <mat-card-content class="overview-grid__content">
            <app-status-badge
              [label]="org.isActive ? 'Active' : 'Inactive'"
              [variant]="org.isActive ? 'success' : 'warning'"
            />
            <p>{{ org.description || 'No description provided.' }}</p>
            <dl class="overview-grid__meta">
              <div><dt>Created</dt><dd>{{ org.createdAt | date: 'medium' }}</dd></div>
              <div><dt>Updated</dt><dd>{{ org.updatedAt ? (org.updatedAt | date: 'medium') : '—' }}</dd></div>
              <div><dt>Members</dt><dd>{{ store.members().length }}</dd></div>
              <div><dt>Teams</dt><dd>{{ teamStore.totalCount() }}</dd></div>
            </dl>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button [routerLink]="['../members']">Manage members</a>
            <a mat-button [routerLink]="['../teams']">View teams</a>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: `
    .overview-grid__content {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .overview-grid__meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: 0.75rem;
      margin: 0;
    }

    .overview-grid__meta dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .overview-grid__meta dd {
      margin: 0.125rem 0 0;
      font: var(--mat-sys-body-large);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailsPageComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(OrganizationStore);
  readonly teamStore = inject(TeamStore);

  ngOnInit(): void {
    this.teamStore.loadList(this.organizationId());
  }
}
