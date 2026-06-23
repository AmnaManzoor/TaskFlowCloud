import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ExportFormat, ExportStatus } from '@features/reports/models/report.enums';
import { AnalyticsService } from '@features/reports/services/analytics.service';

@Component({
  selector: 'app-export-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  template: `
    <button mat-stroked-button type="button" [matMenuTriggerFor]="exportMenu" [disabled]="disabled()">
      <mat-icon>download</mat-icon>
      Export
    </button>
    <mat-menu #exportMenu="matMenu">
      <button mat-menu-item type="button" (click)="export.emit(exportFormats.Csv)">Export CSV</button>
      <button mat-menu-item type="button" (click)="export.emit(exportFormats.Excel)">Export Excel</button>
      <button mat-menu-item type="button" (click)="export.emit(exportFormats.Pdf)">Export PDF</button>
    </mat-menu>
    @if (analyticsService.exportStatus() !== exportStatuses.Idle) {
      <mat-progress-bar
        mode="determinate"
        [value]="analyticsService.exportProgress()"
        aria-label="Export progress"
      />
    }
  `,
  styles: `:host { display: inline-flex; flex-direction: column; gap: 0.25rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportMenuComponent {
  readonly analyticsService = inject(AnalyticsService);

  readonly disabled = input(false);
  readonly export = output<ExportFormat>();

  readonly exportFormats = ExportFormat;
  readonly exportStatuses = ExportStatus;
}
