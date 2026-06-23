import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturePlaceholderComponent } from '@shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-settings-page',
  imports: [FeaturePlaceholderComponent],
  template: `<app-feature-placeholder title="Settings" subtitle="Application preferences placeholder." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {}
