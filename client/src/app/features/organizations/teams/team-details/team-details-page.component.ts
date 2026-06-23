import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TeamStore } from '@features/organizations/stores/team.store';

@Component({
  selector: 'app-team-details-page',
  imports: [MatCardModule, MatButtonModule, RouterLink, DatePipe],
  template: `
    @if (store.selected(); as team) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ team.name }}</mat-card-title>
          <mat-card-subtitle>Team details</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>{{ team.description || 'No description provided.' }}</p>
          <p>Created {{ team.createdAt | date: 'medium' }}</p>
          <p>Members: {{ store.members().length }}</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button [routerLink]="['members']">Manage members</a>
          <a mat-button [routerLink]="['edit']">Edit team</a>
        </mat-card-actions>
      </mat-card>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetailsPageComponent implements OnInit {
  readonly teamId = input.required<string>({ alias: 'teamId' });
  readonly store = inject(TeamStore);

  ngOnInit(): void {
    this.store.loadById(this.teamId());
    this.store.loadMembers(this.teamId());
  }
}
