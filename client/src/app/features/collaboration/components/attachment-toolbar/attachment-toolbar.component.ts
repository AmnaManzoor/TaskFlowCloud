import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-attachment-toolbar',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="attachment-toolbar" role="toolbar" aria-label="Attachment actions">
      <button mat-stroked-button type="button" (click)="uploadClick.emit()">
        <mat-icon>upload_file</mat-icon>
        Upload
      </button>
    </div>
  `,
  styles: `
    .attachment-toolbar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentToolbarComponent {
  readonly uploadClick = output<void>();
}
