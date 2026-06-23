import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TaskProgressComponent } from '@features/tasks/components/task-progress/task-progress.component';
import { checklistProgress } from '@features/tasks/models/task.utils';
import type { ChecklistItem } from '@features/tasks/models/task.models';

@Component({
  selector: 'app-task-checklist',
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TaskProgressComponent,
  ],
  template: `
    <section class="task-checklist" aria-label="Checklist">
      <div class="task-checklist__header">
        <h3>Checklist</h3>
        <app-task-progress [value]="progress()" [showLabel]="true" />
      </div>

      <ul class="task-checklist__items">
        @for (item of items(); track item.id) {
          <li class="task-checklist__item">
            <mat-checkbox
              [checked]="item.isCompleted"
              [disabled]="!editable()"
              (change)="toggleItem(item, $event.checked)"
            >
              {{ item.title }}
            </mat-checkbox>
            @if (editable()) {
              <button
                mat-icon-button
                type="button"
                [attr.aria-label]="'Delete ' + item.title"
                (click)="deleteItem.emit(item.id)"
              >
                <mat-icon>delete_outline</mat-icon>
              </button>
            }
          </li>
        }
      </ul>

      @if (editable() && showAdd()) {
        <form class="task-checklist__add" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="task-checklist__field">
            <mat-label>New item</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>
          <button mat-flat-button type="submit" [disabled]="form.invalid">Add</button>
          <button mat-button type="button" (click)="showAdd.set(false)">Cancel</button>
        </form>
      } @else if (editable()) {
        <button mat-stroked-button type="button" (click)="showAdd.set(true)">
          <mat-icon>add</mat-icon>
          Add item
        </button>
      }
    </section>
  `,
  styles: `
    .task-checklist__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .task-checklist__header h3 {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .task-checklist__items {
      list-style: none;
      margin: 0 0 0.75rem;
      padding: 0;
    }

    .task-checklist__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.25rem 0;
    }

    .task-checklist__add {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .task-checklist__field {
      flex: 1;
      min-width: 12rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskChecklistComponent {
  readonly items = input<ChecklistItem[]>([]);
  readonly editable = input(false);
  readonly addItem = output<string>();
  readonly updateItem = output<{ id: string; title: string; isCompleted: boolean; order: number }>();
  readonly deleteItem = output<string>();

  readonly showAdd = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
  });

  progress() {
    return checklistProgress(this.items());
  }

  toggleItem(item: ChecklistItem, isCompleted: boolean): void {
    this.updateItem.emit({
      id: item.id,
      title: item.title,
      isCompleted,
      order: item.order,
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.addItem.emit(this.form.controls.title.value);
    this.form.reset();
    this.showAdd.set(false);
  }
}
