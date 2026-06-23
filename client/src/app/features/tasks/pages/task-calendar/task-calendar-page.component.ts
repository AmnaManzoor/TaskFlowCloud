import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';
import { WidgetErrorComponent } from '@shared/components/widget-error/widget-error.component';
import { TaskPriorityComponent } from '@features/tasks/components/task-priority/task-priority.component';
import { TaskStore } from '@features/tasks/stores/task.store';
import { TaskStatus } from '@features/tasks/models/task.enums';
import { isOverdue } from '@features/tasks/models/task.utils';
import type { Task } from '@features/tasks/models/task.models';

type CalendarMode = 'month' | 'week' | 'day';

@Component({
  selector: 'app-task-calendar-page',
  imports: [
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    TaskPriorityComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    WidgetErrorComponent,
  ],
  template: `
    <div class="calendar-toolbar">
      <div class="calendar-toolbar__nav">
        <button mat-icon-button type="button" aria-label="Previous" (click)="shift(-1)">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>{{ heading() }}</h2>
        <button mat-icon-button type="button" aria-label="Next" (click)="shift(1)">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <button mat-stroked-button type="button" (click)="goToday()">Today</button>
      </div>
      <div class="calendar-toolbar__modes" role="tablist" aria-label="Calendar view mode">
        @for (mode of modes; track mode) {
          <button
            mat-stroked-button
            type="button"
            role="tab"
            [attr.aria-selected]="viewMode() === mode"
            [class.active]="viewMode() === mode"
            (click)="setMode(mode)"
          >
            {{ mode | titlecase }}
          </button>
        }
      </div>
    </div>

    @if (store.error()) {
      <app-widget-error [message]="store.error()" (retry)="load()" />
    } @else if (store.calendarLoading()) {
      <app-skeleton-loader [rows]="5" [height]="120" />
    } @else if (days().length === 0) {
      <app-empty-state icon="calendar_month" title="No dates in range" description="Adjust the calendar view." />
    } @else {
      <div class="calendar-grid" [class.calendar-grid--day]="viewMode() === 'day'">
        @for (day of days(); track day.key) {
          <section class="calendar-day" [attr.aria-label]="day.label">
            <header class="calendar-day__header" [class.calendar-day__header--today]="day.isToday">
              <span>{{ day.label }}</span>
              <span class="calendar-day__count">{{ day.tasks.length }}</span>
            </header>
            <div class="calendar-day__tasks">
              @for (task of day.tasks; track task.id) {
                <button
                  type="button"
                  class="calendar-task"
                  [class.calendar-task--overdue]="isTaskOverdue(task)"
                  [class.calendar-task--completed]="task.status === completedStatus"
                  (click)="openTask(task.id)"
                >
                  <span class="calendar-task__title">{{ task.title }}</span>
                  <app-task-priority [priority]="task.priority" />
                </button>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: `
    .calendar-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .calendar-toolbar__nav,
    .calendar-toolbar__modes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .calendar-toolbar__nav h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
      min-width: 12rem;
      text-align: center;
    }

    .calendar-toolbar__modes .active {
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      border-color: var(--mat-sys-primary);
    }

    .calendar-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }

    .calendar-grid--day {
      grid-template-columns: 1fr;
    }

    .calendar-day {
      min-height: 8rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.75rem;
      background: var(--mat-sys-surface);
      overflow: hidden;
    }

    .calendar-day__header {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--mat-sys-surface-container-low);
      font: var(--mat-sys-label-large);
    }

    .calendar-day__header--today {
      color: var(--mat-sys-primary);
      font-weight: 600;
    }

    .calendar-day__count {
      color: var(--mat-sys-on-surface-variant);
    }

    .calendar-day__tasks {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.5rem;
    }

    .calendar-task {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0.5rem;
      background: var(--mat-sys-surface-container-lowest);
      cursor: pointer;
      text-align: left;
    }

    .calendar-task--overdue {
      border-color: color-mix(in srgb, var(--mat-sys-error) 50%, var(--mat-sys-outline-variant));
    }

    .calendar-task--completed {
      opacity: 0.7;
    }

    .calendar-task__title {
      font: var(--mat-sys-label-large);
    }

    @media (max-width: 960px) {
      .calendar-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .calendar-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCalendarPageComponent implements OnInit {
  readonly store = inject(TaskStore);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly viewMode = signal<CalendarMode>('month');
  readonly anchorDate = signal(new Date());
  readonly modes: CalendarMode[] = ['month', 'week', 'day'];
  readonly completedStatus = TaskStatus.Completed;

  readonly days = computed(() => {
    const tasks = this.store.calendarItems();
    const range = this.getRange();
    const dayBuckets: { key: string; label: string; isToday: boolean; tasks: Task[] }[] = [];
    const cursor = new Date(range.start);

    while (cursor <= range.end) {
      const key = this.toDateKey(cursor);
      const dayTasks = tasks.filter((task) => task.dueDate === key);
      dayBuckets.push({
        key,
        label: cursor.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: this.isSameDay(cursor, new Date()),
        tasks: dayTasks,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return dayBuckets;
  });

  readonly heading = computed(() => {
    const date = this.anchorDate();
    if (this.viewMode() === 'day') {
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  ngOnInit(): void {
    this.store.setViewMode('calendar');
    this.load();
  }

  load(): void {
    const range = this.getRange();
    this.store.loadCalendar(this.toDateKey(range.start), this.toDateKey(range.end));
  }

  setMode(mode: CalendarMode): void {
    this.viewMode.set(mode);
    this.load();
  }

  shift(direction: -1 | 1): void {
    const date = new Date(this.anchorDate());
    if (this.viewMode() === 'month') {
      date.setMonth(date.getMonth() + direction);
    } else if (this.viewMode() === 'week') {
      date.setDate(date.getDate() + direction * 7);
    } else {
      date.setDate(date.getDate() + direction);
    }
    this.anchorDate.set(date);
    this.load();
  }

  goToday(): void {
    this.anchorDate.set(new Date());
    this.load();
  }

  openTask(taskId: string): void {
    this.router.navigate([], {
      relativeTo: this.route.parent ?? this.route,
      queryParams: { task: taskId },
      queryParamsHandling: 'merge',
    });
  }

  isTaskOverdue(task: Task): boolean {
    return isOverdue(task);
  }

  private getRange(): { start: Date; end: Date } {
    const anchor = new Date(this.anchorDate());
    if (this.viewMode() === 'day') {
      return { start: anchor, end: anchor };
    }
    if (this.viewMode() === 'week') {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }

    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));
    return { start: gridStart, end: gridEnd };
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }
}
