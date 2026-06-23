import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-project-tasks-page',
  imports: [SkeletonLoaderComponent],
  template: `<app-skeleton-loader [rows]="4" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTasksPageComponent implements OnInit {
  readonly projectId = input.required<string>({ alias: 'projectId' });
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.router.navigate(['/tasks/board'], {
      queryParams: { projectId: this.projectId() },
    });
  }
}
