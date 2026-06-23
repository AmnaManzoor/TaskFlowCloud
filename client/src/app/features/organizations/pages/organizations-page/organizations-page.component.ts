import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-organizations-page',
  imports: [FeaturePlaceholderComponent],
  template: `<app-feature-placeholder title="Organizations" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationsPageComponent {}
