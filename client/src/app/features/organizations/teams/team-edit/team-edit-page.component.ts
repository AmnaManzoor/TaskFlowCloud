import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { TeamStore } from '@features/organizations/stores/team.store';

@Component({
  selector: 'app-team-edit-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, LoadingButtonComponent],
  template: `
    <form class="team-form" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline" class="team-form__field">
        <mat-label>Team name</mat-label>
        <input matInput formControlName="name" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="team-form__field">
        <mat-label>Description</mat-label>
        <textarea matInput rows="3" formControlName="description"></textarea>
      </mat-form-field>
      <div class="team-form__actions">
        <button mat-button type="button" color="warn" (click)="confirmDelete()">Delete team</button>
        <app-loading-button type="submit" [loading]="store.saving()" label="Save changes" />
      </div>
    </form>
  `,
  styles: `
    .team-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 36rem;
    }

    .team-form__field {
      width: 100%;
    }

    .team-form__actions {
      display: flex;
      justify-content: space-between;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamEditPageComponent implements OnInit {
  readonly teamId = input.required<string>({ alias: 'teamId' });
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(TeamStore);
  readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    const team = this.store.selected();
    if (team) {
      this.form.patchValue({
        name: team.name,
        description: team.description ?? '',
      });
    } else {
      this.store.loadById(this.teamId());
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.store.update(this.teamId(), this.form.getRawValue());
  }

  confirmDelete(): void {
    this.dialog
      .open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
        data: {
          title: 'Delete team',
          message: 'This team will be permanently deleted.',
          confirmLabel: 'Delete',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.delete(this.teamId(), () =>
            void this.router.navigate(['/organizations', this.organizationId(), 'teams']),
          );
        }
      });
  }
}
