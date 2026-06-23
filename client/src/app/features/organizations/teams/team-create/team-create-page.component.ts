import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { TeamStore } from '@features/organizations/stores/team.store';

@Component({
  selector: 'app-team-create-page',
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
        <button mat-button type="button" (click)="cancel()">Cancel</button>
        <app-loading-button type="submit" [loading]="store.saving()" label="Create team" />
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
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCreatePageComponent implements OnInit {
  readonly organizationId = input.required<string>({ alias: 'organizationId' });
  readonly store = inject(TeamStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.store.clearError();
  }

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.create(
      { organizationId: this.organizationId(), name: value.name, description: value.description || null },
      (team) =>
        void this.router.navigate([
          '/organizations',
          this.organizationId(),
          'teams',
          team.id,
        ]),
    );
  }

  cancel(): void {
    void this.router.navigate(['/organizations', this.organizationId(), 'teams']);
  }
}
