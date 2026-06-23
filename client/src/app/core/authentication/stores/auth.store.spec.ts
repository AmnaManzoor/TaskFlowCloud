import { AuthStore } from '@core/authentication/stores/auth.store';

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    store = new AuthStore();
  });

  it('should start unauthenticated', () => {
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
  });

  it('should set session from auth response user', () => {
    store.setSession('token', {
      id: '1',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      isActive: true,
      emailConfirmed: true,
      roles: ['Member'],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });

    expect(store.isAuthenticated()).toBeTrue();
    expect(store.user()?.email).toBe('user@test.com');
    expect(store.hasRole('Member')).toBeTrue();
  });

  it('should clear session', () => {
    store.setAccessToken('token');
    store.clear();
    expect(store.isAuthenticated()).toBeFalse();
  });
});
