import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { fileCategory, fileIcon } from '@features/collaboration/models/collaboration.utils';

@Component({
  selector: 'app-file-icon',
  imports: [MatIconModule],
  template: `<mat-icon [attr.aria-label]="extension()">{{ icon() }}</mat-icon>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileIconComponent {
  readonly extension = input('');
  readonly contentType = input('');

  icon() {
    return fileIcon(fileCategory(this.extension(), this.contentType()));
  }
}
