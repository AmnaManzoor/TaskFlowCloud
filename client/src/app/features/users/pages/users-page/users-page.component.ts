import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-users-page',
  imports: [FeaturePlaceholderComponent],
  template: `<app-feature-placeholder title="Users" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {}
