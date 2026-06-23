import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaskLabelChipComponent } from '@features/tasks/components/task-labels/task-label-chip.component';
import type { TaskLabel } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-labels',
  imports: [TaskLabelChipComponent, MatButtonModule, MatIconModule],
  template: `
    <div class="task-labels" role="list" aria-label="Task labels">
      @for (label of labels(); track label.id) {
        <div class="task-labels__item" role="listitem">
          <app-task-label-chip [name]="label.name" [color]="label.color" />
          @if (editable()) {
            <button
              mat-icon-button
              type="button"
              class="task-labels__remove"
              [attr.aria-label]="'Remove label ' + label.name"
              (click)="removeLabel.emit(label.id)"
            >
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      }
      @if (editable()) {
        <button mat-stroked-button type="button" class="task-labels__add" (click)="addLabel.emit()">
          <mat-icon>add</mat-icon>
          Add label
        </button>
      }
    </div>
  `,
  styles: `
    .task-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .task-labels__item {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
    }

    .task-labels__remove {
      width: 1.75rem;
      height: 1.75rem;
      line-height: 1.75rem;
    }

    .task-labels__add {
      height: 1.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskLabelsComponent {
  readonly labels = input<TaskLabel[]>([]);
  readonly editable = input(false);
  readonly addLabel = output<void>();
  readonly removeLabel = output<string>();
}
