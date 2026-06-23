import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@core/config/app-config.token';
import { environment } from '@env/environment';
import { TokenService } from '@core/authentication/services/token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: environment }],
    });

    service = TestBed.inject(TokenService);
    service.clearTokens();
  });

  it('should report missing session when no tokens stored', () => {
    expect(service.hasStoredSession()).toBeFalse();
  });

  it('should detect expired access token when expiration is missing', () => {
    expect(service.isAccessTokenExpired()).toBeTrue();
  });
});
