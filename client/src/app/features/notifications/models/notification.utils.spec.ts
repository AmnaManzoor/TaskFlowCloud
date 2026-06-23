import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificationCategoryFilter, NotificationPriority, NotificationType } from '@features/notifications/models/notification.enums';
import type { NotificationItem } from '@features/notifications/models/notification.models';
import {
  formatDateGroupLabel,
  getNotificationIcon,
  getNotificationPriority,
  groupNotificationsByDate,
  matchesCategoryFilter,
} from '@features/notifications/models/notification.utils';

describe('notification.utils', () => {
  const sample: NotificationItem = {
    id: '1',
    userId: 'u1',
    type: NotificationType.MentionedInComment,
    title: 'Mention',
    message: 'You were mentioned',
    referenceType: 'Task',
    referenceId: 't1',
    isRead: false,
    readAt: null,
    createdAt: '2026-06-23T10:00:00Z',
  };

  it('should map icons and priority', () => {
    expect(getNotificationIcon(NotificationType.MentionedInComment)).toBe('alternate_email');
    expect(getNotificationPriority(NotificationType.MentionedInComment)).toBe(NotificationPriority.High);
  });

  it('should group notifications by date', () => {
    const groups = groupNotificationsByDate([sample]);
    expect(groups.length).toBe(1);
    expect(groups[0].items[0].id).toBe('1');
  });

  it('should format date group labels', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatDateGroupLabel(today)).toBe('Today');
  });

  it('should match category filters', () => {
    expect(matchesCategoryFilter(sample, NotificationCategoryFilter.Mentions)).toBeTrue();
    expect(matchesCategoryFilter(sample, NotificationCategoryFilter.Projects)).toBeFalse();
  });
});
