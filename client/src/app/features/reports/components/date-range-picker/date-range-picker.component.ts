import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { DateRangePreset } from '@features/reports/models/report.enums';
import { ReportStore } from '@features/reports/stores/report.store';
import { AnalyticsStore } from '@features/reports/stores/analytics.store';

@Component({
  selector: 'app-date-range-picker',
  imports: [MatButtonModule, MatMenuModule],
  template: `
    <button mat-stroked-button type="button" [matMenuTriggerFor]="rangeMenu" aria-label="Date range">
      {{ label() }}
    </button>
    <mat-menu #rangeMenu="matMenu">
      @for (option of options; track option.value) {
        <button mat-menu-item type="button" (click)="select(option.value)">{{ option.label }}</button>
      }
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePickerComponent {
  readonly reportStore = inject(ReportStore, { optional: true });
  readonly analyticsStore = inject(AnalyticsStore, { optional: true });

  readonly rangeChanged = output<DateRangePreset>();

  readonly options = [
    { value: DateRangePreset.All, label: 'All time' },
    { value: DateRangePreset.Week, label: 'Last 7 days' },
    { value: DateRangePreset.Month, label: 'Last 30 days' },
    { value: DateRangePreset.Quarter, label: 'Last 90 days' },
  ];

  label(): string {
    const preset = this.reportStore?.dateRange().preset ?? this.analyticsStore?.dateRange().preset ?? 'all';
    return this.options.find((o) => o.value === preset)?.label ?? 'All time';
  }

  select(preset: DateRangePreset): void {
    this.reportStore?.setDateRangePreset(preset);
    this.analyticsStore?.setDateRangePreset(preset);
    this.rangeChanged.emit(preset);
  }
}
