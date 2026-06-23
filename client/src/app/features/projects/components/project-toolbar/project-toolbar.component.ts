import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchBoxComponent } from '@shared/components/search-box/search-box.component';
import { TableToolbarComponent } from '@shared/components/table-toolbar/table-toolbar.component';
import { ProjectFilterComponent } from '@features/projects/components/project-filter/project-filter.component';
import type { ProjectFilters } from '@features/projects/models/project.models';

@Component({
  selector: 'app-project-toolbar',
  imports: [TableToolbarComponent, SearchBoxComponent, ProjectFilterComponent],
  template: `
    <app-table-toolbar>
      <div toolbar-start class="project-toolbar__start">
        <app-search-box
          [value]="search()"
          (valueChange)="searchChange.emit($event)"
          searchPlaceholder="Search projects by name or code..."
        />
        <app-project-filter
          [filters]="filters()"
          [organizations]="organizations()"
          (filtersChange)="filtersChange.emit($event)"
        />
      </div>
      <div toolbar-end>
        <ng-content select="[toolbar-actions]" />
      </div>
    </app-table-toolbar>
  `,
  styles: `
    .project-toolbar__start {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectToolbarComponent {
  readonly search = input('');
  readonly filters = input.required<ProjectFilters>();
  readonly organizations = input<{ id: string; name: string }[]>([]);

  readonly searchChange = output<string>();
  readonly filtersChange = output<Partial<ProjectFilters>>();
}
