import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { LoadingButtonComponent } from '@shared/components/loading-button/loading-button.component';
import { UserStore } from '@features/organizations/stores/user.store';

@Component({
  selector: 'app-user-profile-page',
  imports: [
    ReactiveFormsModule,
    BreadcrumbComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LoadingButtonComponent,
  ],
  template: `
    <app-breadcrumb [items]="breadcrumbs()" />

    <form class="profile-form" [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline" class="profile-form__field">
        <mat-label>First name</mat-label>
        <input matInput formControlName="firstName" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="profile-form__field">
        <mat-label>Last name</mat-label>
        <input matInput formControlName="lastName" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="profile-form__field">
        <mat-label>Profile image URL</mat-label>
        <input matInput formControlName="profileImageUrl" />
      </mat-form-field>

      <div class="profile-form__actions">
        <button mat-button type="button" (click)="router.navigate(['/users', userId()])">Cancel</button>
        <app-loading-button type="submit" [loading]="store.saving()" label="Save profile" />
      </div>
    </form>
  `,
  styles: `
    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 36rem;
    }

    .profile-form__field {
      width: 100%;
    }

    .profile-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfilePageComponent implements OnInit {
  readonly userId = input.required<string>({ alias: 'userId' });
  readonly store = inject(UserStore);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    profileImageUrl: [''],
  });

  constructor() {
    effect(() => {
      const user = this.store.selected();
      if (user && user.id === this.userId()) {
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl ?? '',
        });
      }
    });
  }

  ngOnInit(): void {
    if (!this.store.selected() || this.store.selected()?.id !== this.userId()) {
      this.store.loadById(this.userId());
    }
  }

  breadcrumbs() {
    const user = this.store.selected();
    return [
      { label: 'Users', route: '/users' },
      { label: user ? `${user.firstName} ${user.lastName}` : 'User', route: `/users/${this.userId()}` },
      { label: 'Edit profile' },
    ];
  }

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.store.updateProfile(
      this.userId(),
      {
        firstName: value.firstName,
        lastName: value.lastName,
        profileImageUrl: value.profileImageUrl || null,
      },
      () => void this.router.navigate(['/users', this.userId()]),
    );
  }
}
