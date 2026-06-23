import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DashboardWidgetComponent } from '@shared/components/dashboard-widget/dashboard-widget.component';
import { PriorityChipComponent } from '@shared/components/priority-chip/priority-chip.component';
import { DashboardStore } from '@features/dashboard/stores/dashboard.store';

@Component({
  selector: 'app-calendar-widget',
  imports: [DashboardWidgetComponent, MatIconModule, PriorityChipComponent, DatePipe],
  template: `
    <app-dashboard-widget
      title="Calendar"
      subtitle="Upcoming deadlines and due dates"
      icon="event"
      [loading]="store.loading()"
      [empty]="store.calendarEvents().length === 0"
      emptyTitle="No upcoming deadlines"
      emptyDescription="Tasks and project milestones will appear on your calendar."
    >
      <ul class="calendar" aria-label="Upcoming calendar events">
        @for (event of store.calendarEvents(); track event.id) {
          <li class="calendar__item u-animate-fade-in">
            <div class="calendar__date" aria-hidden="true">
              <mat-icon>{{ iconFor(event.type) }}</mat-icon>
            </div>
            <div class="calendar__content">
              <p class="calendar__title">{{ event.title }}</p>
              <p class="calendar__subtitle">{{ event.subtitle }}</p>
              @if (event.priority !== undefined) {
                <app-priority-chip [taskPriority]="event.priority" />
              }
            </div>
            <time class="calendar__when" [dateTime]="event.date">{{ event.date | date: 'MMM d' }}</time>
          </li>
        }
      </ul>
    </app-dashboard-widget>
  `,
  styles: `
    .calendar {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .calendar__item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
      align-items: center;
      padding: 0.875rem;
      border-radius: 0.75rem;
      background: var(--mat-sys-surface-container-lowest);
    }

    .calendar__date mat-icon {
      color: var(--mat-sys-primary);
    }

    .calendar__title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .calendar__subtitle {
      margin: 0.125rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .calendar__when {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarWidgetComponent {
  readonly store = inject(DashboardStore);

  iconFor(type: 'task' | 'project' | 'overdue'): string {
    switch (type) {
      case 'project':
        return 'folder';
      case 'overdue':
        return 'warning';
      default:
        return 'task';
    }
  }
}
