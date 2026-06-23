import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from '@core/authentication/guards/auth.guard';
import { AuthService } from '@core/authentication/services/auth.service';
import { AuthStore } from '@core/authentication/stores/auth.store';

describe('authGuard', () => {
  it('should allow navigation when authenticated with user', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ id: '1' }),
          },
        },
        {
          provide: AuthService,
          useValue: { tryRestoreSession: jasmine.createSpy('tryRestoreSession') },
        },
        { provide: Router, useValue: { createUrlTree: jasmine.createSpy('createUrlTree') } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/dashboard' } as never),
    );

    expect(result).toBeTrue();
  });
});
