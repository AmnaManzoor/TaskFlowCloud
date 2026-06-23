import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { OrganizationStore } from '@features/organizations/stores/organization.store';

@Component({
  selector: 'app-organization-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, BreadcrumbComponent, SkeletonLoaderComponent],
  template: `
    <div class="org-shell">
      <app-breadcrumb [items]="breadcrumbs()" />

      @if (store.loading() && !store.selected()) {
        <app-skeleton-loader [rows]="4" />
      } @else if (store.selected(); as org) {
        <header class="org-shell__header">
          <div>
            <h1 class="org-shell__title">{{ org.name }}</h1>
            <p class="org-shell__subtitle">{{ org.description || 'Organization workspace' }}</p>
          </div>
        </header>

        <nav mat-tab-nav-bar [tabPanel]="tabPanel" aria-label="Organization sections">
          @for (tab of tabs; track tab.path) {
            <a mat-tab-link [routerLink]="tab.path" routerLinkActive #rla="routerLinkActive" [active]="rla.isActive">
              {{ tab.label }}
            </a>
          }
        </nav>
        <mat-tab-nav-panel #tabPanel>
          <div class="org-shell__content">
            <router-outlet />
          </div>
        </mat-tab-nav-panel>
      }
    </div>
  `,
  styles: `
    .org-shell__header {
      margin-bottom: 1rem;
    }

    .org-shell__title {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }

    .org-shell__subtitle {
      margin: 0.375rem 0 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .org-shell__content {
      padding-top: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationShellComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(OrganizationStore);

  readonly tabs = [
    { label: 'Overview', path: 'overview' },
    { label: 'Members', path: 'members' },
    { label: 'Teams', path: 'teams' },
    { label: 'Settings', path: 'settings' },
  ];

  ngOnInit(): void {
    this.store.loadById(this.organizationId());
    this.store.loadMembers(this.organizationId());
  }

  breadcrumbs() {
    const org = this.store.selected();
    return [
      { label: 'Organizations', route: '/organizations' },
      { label: org?.name ?? 'Organization' },
    ];
  }
}
